import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repository: Repository<Notification>
  ) {}

  private getRepo(manager?: EntityManager): Repository<Notification> {
    return manager ? manager.getRepository(Notification) : this.repository;
  }

  create(data: Partial<Notification>, manager?: EntityManager): Notification {
    return this.getRepo(manager).create(data);
  }

  save(notification: Notification, manager?: EntityManager): Promise<Notification> {
    return this.getRepo(manager).save(notification);
  }

  findById(id: string, manager?: EntityManager): Promise<Notification | null> {
    return this.getRepo(manager).findOne({ where: { id }, relations: ['user'] });
  }

  findByUser(userId: string): Promise<Notification[]> {
    return this.repository.find({ where: { user: { id: userId } }, order: { createdAt: 'DESC' } });
  }
}
