import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(dto: CreateUserDto, manager?: EntityManager): Promise<User> {
    const existing = await this.usersRepository.findByEmail(dto.email.toLowerCase(), manager);
    if (existing) {
      throw new BadRequestException('Email is already registered.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.usersRepository.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      roles: dto.roles?.length ? dto.roles : ['member'],
      isActive: true
    }, manager);

    return this.usersRepository.save(user, manager);
  }

  findByEmail(email: string, manager?: EntityManager): Promise<User | null> {
    return this.usersRepository.findByEmail(email.toLowerCase(), manager);
  }

  async findByIdOrFail(id: string, manager?: EntityManager): Promise<User> {
    const user = await this.usersRepository.findById(id, manager);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return user;
  }

  listUsers(manager?: EntityManager): Promise<User[]> {
    return this.usersRepository.findAll(manager);
  }

  async updateUser(id: string, dto: UpdateUserDto, manager?: EntityManager): Promise<User> {
    const user = await this.findByIdOrFail(id, manager);

    if (dto.roles) {
      if (!dto.roles.length) {
        throw new BadRequestException('Roles cannot be empty.');
      }
      user.roles = dto.roles;
    }

    if (typeof dto.isActive === 'boolean') {
      user.isActive = dto.isActive;
    }

    return this.usersRepository.save(user, manager);
  }
}
