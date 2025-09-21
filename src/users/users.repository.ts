import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ) {}

  private getRepo(manager?: EntityManager): Repository<User> {
    return manager ? manager.getRepository(User) : this.repository;
  }

  create(data: Partial<User>, manager?: EntityManager): User {
    return this.getRepo(manager).create(data);
  }

  save(user: User, manager?: EntityManager): Promise<User> {
    return this.getRepo(manager).save(user);
  }

  findByEmail(email: string, manager?: EntityManager): Promise<User | null> {
    return this.getRepo(manager).findOne({ where: { email } });
  }

  findById(id: string, manager?: EntityManager): Promise<User | null> {
    return this.getRepo(manager).findOne({ where: { id } });
  }

  findAll(manager?: EntityManager): Promise<User[]> {
    return this.getRepo(manager).find();
  }
}
