import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../user.entity';
import { UsersRepository } from '../users.repository';
import { UsersService } from '../users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get(UsersService);
    repository = module.get(UsersRepository) as jest.Mocked<UsersRepository>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createUser', () => {
    it('hashes the password, normalises the payload, and persists the user', async () => {
      const dto: CreateUserDto = {
        email: 'TestUser@Example.COM',
        firstName: '  Jane ',
        lastName: ' Doe  ',
        phoneNumber: ' 123456789 ',
        password: 'Sup3rSecret!',
        roles: ['admin']
      };

      const createdUser = {
        id: 'user-1',
        email: 'testuser@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        phoneNumber: '123456789',
        passwordHash: 'hashed-password',
        roles: ['admin'],
        isActive: true
      } as unknown as User;

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password');
      repository.findByEmail.mockResolvedValue(null);
      repository.create.mockReturnValue(createdUser);
      repository.save.mockResolvedValue(createdUser);

      const result = await service.createUser(dto);

      expect(repository.findByEmail).toHaveBeenCalledWith('testuser@example.com', undefined);
      expect(bcrypt.hash).toHaveBeenCalledWith('Sup3rSecret!', 12);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'testuser@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
          phoneNumber: '123456789',
          passwordHash: 'hashed-password',
          roles: ['admin'],
          isActive: true
        }),
        undefined
      );
      expect(repository.save).toHaveBeenCalledWith(createdUser, undefined);
      expect(result).toBe(createdUser);
    });

    it('throws when a user with the e-mail already exists', async () => {
      repository.findByEmail.mockResolvedValue({} as User);

      await expect(
        service.createUser({
          email: 'existing@example.com',
          password: 'Password123',
          firstName: 'Existing',
          lastName: 'User'
        })
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findByIdOrFail', () => {
    it('throws a NotFoundException when the user is missing', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findByIdOrFail('missing-user')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateUser', () => {
    it('applies updates and persists the entity', async () => {
      const existingUser = {
        id: 'user-2',
        email: 'member@example.com',
        firstName: 'Old',
        lastName: 'Name',
        phoneNumber: '555-1234',
        passwordHash: 'hash',
        roles: ['member'],
        isActive: true
      } as unknown as User;

      repository.findById.mockResolvedValue(existingUser);
      repository.save.mockImplementation(async (user: User) => user);

      const dto: UpdateUserDto = {
        firstName: '  New  ',
        lastName: '  Person ',
        phoneNumber: ' 987-6543 ',
        roles: ['manager'],
        isActive: false
      };

      const result = await service.updateUser(existingUser.id, dto);

      expect(existingUser.firstName).toBe('New');
      expect(existingUser.lastName).toBe('Person');
      expect(existingUser.phoneNumber).toBe('987-6543');
      expect(existingUser.roles).toEqual(['manager']);
      expect(existingUser.isActive).toBe(false);
      expect(repository.save).toHaveBeenCalledWith(existingUser, undefined);
      expect(result).toBe(existingUser);
    });

    it('rejects empty role updates', async () => {
      repository.findById.mockResolvedValue({
        id: 'user-3'
      } as User);

      await expect(
        service.updateUser('user-3', {
          roles: []
        })
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
