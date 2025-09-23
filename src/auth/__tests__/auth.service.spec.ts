import * as bcrypt from 'bcryptjs';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { RefreshTokenRepository } from '../refresh-token.repository';
import { DataSource } from 'typeorm';
import { User } from '../../users/user.entity';
import { LoginDto } from '../dto/login.dto';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn()
    } as unknown as jest.Mocked<UsersService>;

    authService = new AuthService(
      usersService,
      {} as unknown as RefreshTokenRepository,
      {} as unknown as DataSource
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns user details together with tokens on login', async () => {
    const password = 'password123';
    const passwordHash = await bcrypt.hash(password, 1);

    const user: User = {
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'Jonas',
      lastName: 'Jonaitis',
      passwordHash,
      roles: ['beekeeper'],
      isActive: true
    } as User;

    usersService.findByEmail.mockResolvedValue(user);

    const refreshExpiresAt = new Date('2030-01-01T00:00:00.000Z');

    jest.spyOn(authService as any, 'generateTokens').mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshExpiresAt
    });

    const dto: LoginDto = {
      email: user.email,
      password
    } as LoginDto;

    const result = await authService.login(dto);

    expect(result.user).toEqual({
      id: user.id,
      email: user.email,
      name: 'Jonas Jonaitis',
      role: 'beekeeper'
    });
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.refreshExpiresAt).toBe(refreshExpiresAt);
  });
});
