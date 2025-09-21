import 'reflect-metadata';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { User } from '../user.entity';
import { UsersRepository } from '../users.repository';
import { UsersService } from '../users.service';
import { UsersController } from '../users.controller';

describe('UsersController (integration)', () => {
  let app: INestApplication;
  let repository: jest.Mocked<UsersRepository>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService, UsersRepository]
    })
      .overrideProvider(UsersRepository)
      .useValue({
        findByEmail: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        findById: jest.fn(),
        findAll: jest.fn()
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { userId: 'user-1', roles: ['admin'] };
          return true;
        }
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          if (!req.user) {
            req.user = { userId: 'user-1', roles: ['admin'] };
          }
          return true;
        }
      })
      .compile();

    repository = moduleRef.get(UsersRepository) as jest.Mocked<UsersRepository>;

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns a sanitised list of users for administrators', async () => {
    const now = new Date();
    const users: User[] = [
      {
        id: 'user-1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        phoneNumber: null,
        passwordHash: 'hash',
        roles: ['admin'],
        isActive: true,
        createdAt: now,
        updatedAt: now
      } as unknown as User
    ];

    repository.findAll.mockResolvedValue(users);

    const response = await request(app.getHttpServer()).get('/users').expect(200);

    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual([
      expect.objectContaining({
        id: 'user-1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        phoneNumber: null,
        roles: ['admin'],
        isActive: true
      })
    ]);
    expect(new Date(response.body[0].createdAt).toISOString()).toBe(now.toISOString());
    expect(new Date(response.body[0].updatedAt).toISOString()).toBe(now.toISOString());
    expect(response.body[0]).not.toHaveProperty('passwordHash');
  });

  it('returns the current user profile via the /users/me endpoint', async () => {
    const now = new Date();
    const me = {
      id: 'user-1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      phoneNumber: '123456789',
      passwordHash: 'hash',
      roles: ['admin'],
      isActive: true,
      createdAt: now,
      updatedAt: now
    } as unknown as User;

    repository.findById.mockResolvedValue(me);

    const response = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(repository.findById).toHaveBeenCalledWith('user-1', undefined);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: 'user-1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        phoneNumber: '123456789',
        roles: ['admin'],
        isActive: true
      })
    );
    expect(response.body).not.toHaveProperty('passwordHash');
  });
});
