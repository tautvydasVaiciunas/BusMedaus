import { Inject, Injectable, UnauthorizedException, forwardRef } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RefreshTokenRepository } from './refresh-token.repository';
import { User } from '../users/user.entity';

interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  tokenId?: string;
  type: 'access' | 'refresh';
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresAt: Date;
  user: AuthUser;
}

const mapAuthUser = (user: User): AuthUser => {
  const primaryRole = user.roles?.[0] ?? 'user';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

  return {
    id: user.id,
    email: user.email,
    name: name || primaryRole,
    role: primaryRole
  };
};

@Injectable()
export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'change-me';
  private readonly accessTokenExpiry = process.env.JWT_EXPIRES_IN || '15m';
  private readonly refreshTokenTtlMs = Number(process.env.JWT_REFRESH_TTL_MS || 1000 * 60 * 60 * 24 * 7);

  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly dataSource: DataSource
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const { user, accessToken, refreshToken, refreshExpiresAt } = await this.dataSource.transaction(
      async (manager) => {
        const user = await this.usersService.createUser(dto, manager);
        const tokens = await this.generateTokens(user, manager);
        return { user, ...tokens };
      }
    );

    const decoded = jwt.decode(accessToken) as jwt.JwtPayload | null;
    const expiresIn = decoded?.exp ? decoded.exp * 1000 - Date.now() : 0;
    return { accessToken, refreshToken, expiresIn, refreshExpiresAt, user: mapAuthUser(user) };
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken, refreshExpiresAt } = await this.generateTokens(user);
    const decoded = jwt.decode(accessToken) as jwt.JwtPayload | null;
    const expiresIn = decoded?.exp ? decoded.exp * 1000 - Date.now() : 0;
    return { accessToken, refreshToken, expiresIn, refreshExpiresAt, user: mapAuthUser(user) };
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = jwt.verify(refreshToken, this.jwtSecret) as JwtPayload;
      if (payload.type !== 'refresh' || !payload.tokenId) {
        throw new Error('Invalid token');
      }
      const stored = await this.refreshTokenRepository.findByTokenId(payload.tokenId);
      if (stored) {
        await this.refreshTokenRepository.revoke(stored);
        await this.refreshTokenRepository.revokeAllForUser(stored.user.id);
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthTokens> {
    const refreshToken = dto.refreshToken;
    let payload: JwtPayload;
    try {
      payload = jwt.verify(refreshToken, this.jwtSecret) as JwtPayload;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh' || !payload.tokenId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const existing = await this.refreshTokenRepository.findByTokenId(payload.tokenId);
    if (!existing || existing.revoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (existing.expiresAt.getTime() < Date.now()) {
      await this.refreshTokenRepository.revoke(existing);
      throw new UnauthorizedException('Refresh token expired');
    }

    const matches = await bcrypt.compare(refreshToken, existing.tokenHash);
    if (!matches) {
      await this.refreshTokenRepository.revoke(existing);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = existing.user;
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    await this.refreshTokenRepository.revoke(existing);
    const { accessToken, refreshToken: newRefreshToken, refreshExpiresAt } = await this.generateTokens(user);
    const decoded = jwt.decode(accessToken) as jwt.JwtPayload | null;
    const expiresIn = decoded?.exp ? decoded.exp * 1000 - Date.now() : 0;
    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn,
      refreshExpiresAt,
      user: mapAuthUser(user)
    };
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as JwtPayload;
      if (payload.type !== 'access') {
        throw new Error('Invalid token');
      }
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private async generateTokens(
    user: User,
    manager?: EntityManager
  ): Promise<{ accessToken: string; refreshToken: string; refreshExpiresAt: Date }> {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      type: 'access'
    };
    const accessToken = jwt.sign(
      accessPayload,
      this.jwtSecret as jwt.Secret,
      { expiresIn: this.accessTokenExpiry } as jwt.SignOptions
    ) as string;

    const tokenId = randomUUID();
    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      type: 'refresh',
      tokenId
    };

    const refreshToken = jwt.sign(
      refreshPayload,
      this.jwtSecret as jwt.Secret,
      { expiresIn: Math.floor(this.refreshTokenTtlMs / 1000) } as jwt.SignOptions
    ) as string;

    const refreshExpiresAt = new Date(Date.now() + this.refreshTokenTtlMs);
    const tokenHash = await bcrypt.hash(refreshToken, 12);

    const tokenEntity = this.refreshTokenRepository.create(
      {
        user,
        tokenId,
        tokenHash,
        expiresAt: refreshExpiresAt,
        revoked: false
      },
      manager
    );
    await this.refreshTokenRepository.save(tokenEntity, manager);

    return { accessToken, refreshToken, refreshExpiresAt };
  }
}
