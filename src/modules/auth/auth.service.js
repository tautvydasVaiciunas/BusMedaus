import { randomUUID } from 'crypto';
import { requireFields, validateEmail, validateStringLength } from '../../common/utils/validators.js';
import HttpError from '../../common/utils/http-errors.js';
import { signJwt, verifyJwt } from '../../security/jwt.js';
import { hashPassword, verifyPassword } from '../../security/bcrypt.js';
import config from '../../config.js';
import UserRepository from '../users/user.repository.js';
import RefreshTokenRepository from './refresh-token.repository.js';

function sanitizeUser(user) {
  const clone = { ...user };
  delete clone.passwordHash;
  return clone;
}

export class AuthService {
  constructor(database) {
    this.database = database;
    this.users = new UserRepository(database);
    this.refreshTokens = new RefreshTokenRepository(database);
  }

  async issueTokens(user, context, metadata = {}) {
    const accessToken = signJwt({ sub: user.id, role: user.role }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
    const refreshToken = randomUUID();
    const tokenHash = await hashPassword(refreshToken);
    const expiresAt = new Date(Date.now() + config.refreshTokenTtl * 1000).toISOString();
    const record = this.refreshTokens.createToken(
      {
        userId: user.id,
        tokenHash,
        expiresAt,
        createdByIp: metadata.ip,
        userAgent: metadata.userAgent,
      },
      context,
    );
    return {
      accessToken,
      refreshToken,
      refreshTokenId: record.id,
      expiresAt,
      user: sanitizeUser(user),
    };
  }

  async register(payload, metadata = {}) {
    requireFields(payload, ['email', 'password']);
    validateEmail(payload.email);
    validateStringLength(payload.password, 'password', 8, 128);
    if (payload.name) {
      validateStringLength(payload.name, 'name', 1, 120);
    }

    const passwordHash = await hashPassword(payload.password);
    return this.database.transaction(async (ctx) => {
      const existing = this.users.findByEmail(payload.email, ctx);
      if (existing) {
        throw HttpError.conflict('Email already registered');
      }
      const user = this.users.create(
        {
          email: payload.email,
          passwordHash,
          role: payload.role && ['ADMIN', 'BEEKEEPER', 'MEMBER'].includes(payload.role)
            ? payload.role
            : 'MEMBER',
          name: payload.name,
          metadata: payload.metadata,
        },
        ctx,
      );
      return this.issueTokens(user, ctx, metadata);
    });
  }

  async login(payload, metadata = {}) {
    requireFields(payload, ['email', 'password']);
    const user = this.users.findByEmail(payload.email);
    if (!user) {
      throw HttpError.unauthorized('Invalid credentials');
    }
    const valid = await verifyPassword(payload.password, user.passwordHash);
    if (!valid) {
      throw HttpError.unauthorized('Invalid credentials');
    }
    return this.database.transaction(async (ctx) => {
      this.refreshTokens.deleteTokensByUser(user.id, ctx);
      return this.issueTokens(user, ctx, metadata);
    });
  }

  async refreshSession(refreshToken, metadata = {}) {
    if (!refreshToken) {
      throw HttpError.badRequest('Refresh token required');
    }
    return this.database.transaction(async (ctx) => {
      const tokens = this.refreshTokens.getAll(ctx);
      for (const token of tokens) {
        if (token.revokedAt || new Date(token.expiresAt) <= new Date()) {
          continue;
        }
        const matches = await verifyPassword(refreshToken, token.tokenHash);
        if (!matches) {
          continue;
        }
        const user = this.users.findById(token.userId, ctx);
        if (!user) {
          throw HttpError.unauthorized('User not found for token');
        }
        this.refreshTokens.revokeToken(token.id, ctx, { ip: metadata.ip });
        return this.issueTokens(user, ctx, metadata);
      }
      throw HttpError.unauthorized('Invalid refresh token');
    });
  }

  async logout(userId) {
    return this.database.transaction(async (ctx) => {
      this.refreshTokens.deleteTokensByUser(userId, ctx);
      return { success: true };
    });
  }

  verifyAccessToken(token) {
    try {
      return verifyJwt(token, config.jwtSecret);
    } catch (error) {
      throw HttpError.unauthorized(error.message);
    }
  }
}

export default AuthService;
