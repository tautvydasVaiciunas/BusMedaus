import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Task } from './task.entity';

@Injectable()
export class TasksRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repository: Repository<Task>
  ) {}

  private getRepo(manager?: EntityManager): Repository<Task> {
    return manager ? manager.getRepository(Task) : this.repository;
  }

  create(data: Partial<Task>, manager?: EntityManager): Task {
    return this.getRepo(manager).create(data);
  }

  save(task: Task, manager?: EntityManager): Promise<Task> {
    return this.getRepo(manager).save(task);
  }

  findById(id: string, manager?: EntityManager): Promise<Task | null> {
    return this.getRepo(manager).findOne({
      where: { id },
      relations: ['hive', 'assignedTo', 'createdBy', 'hive.owner', 'hive.members']
    });
  }

  async remove(task: Task, manager?: EntityManager): Promise<Task> {
    return this.getRepo(manager).remove(task);
  }

  findByHive(hiveId: string): Promise<Task[]> {
    return this.repository.find({
      where: { hive: { id: hiveId } },
      relations: ['hive', 'assignedTo', 'createdBy'],
      order: { createdAt: 'DESC' }
    });
  }
}
