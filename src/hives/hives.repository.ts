import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Hive } from './hive.entity';

@Injectable()
export class HivesRepository {
  constructor(
    @InjectRepository(Hive)
    private readonly repository: Repository<Hive>
  ) {}

  private getRepo(manager?: EntityManager): Repository<Hive> {
    return manager ? manager.getRepository(Hive) : this.repository;
  }

  create(data: Partial<Hive>, manager?: EntityManager): Hive {
    return this.getRepo(manager).create(data);
  }

  save(hive: Hive, manager?: EntityManager): Promise<Hive> {
    return this.getRepo(manager).save(hive);
  }

  findById(id: string, manager?: EntityManager): Promise<Hive | null> {
    return this.getRepo(manager).findOne({ where: { id }, relations: ['owner', 'members'] });
  }

  async findAllForUser(userId: string): Promise<Hive[]> {
    return this.repository
      .createQueryBuilder('hive')
      .leftJoinAndSelect('hive.owner', 'owner')
      .leftJoinAndSelect('hive.members', 'members')
      .where('owner.id = :userId', { userId })
      .orWhere('members.id = :userId', { userId })
      .getMany();
  }

  async remove(hive: Hive, manager?: EntityManager): Promise<Hive> {
    return this.getRepo(manager).remove(hive);
  }

  findAll(manager?: EntityManager): Promise<Hive[]> {
    return this.getRepo(manager).find({ relations: ['owner', 'members'] });
  }
}
