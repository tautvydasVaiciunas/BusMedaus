import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { NotificationSubscription } from './notification-subscription.entity';

@Injectable()
export class NotificationSubscriptionsRepository {
  constructor(
    @InjectRepository(NotificationSubscription)
    private readonly repository: Repository<NotificationSubscription>
  ) {}

  private getRepo(manager?: EntityManager): Repository<NotificationSubscription> {
    return manager ? manager.getRepository(NotificationSubscription) : this.repository;
  }

  create(data: Partial<NotificationSubscription>, manager?: EntityManager): NotificationSubscription {
    return this.getRepo(manager).create(data);
  }

  save(subscription: NotificationSubscription, manager?: EntityManager): Promise<NotificationSubscription> {
    return this.getRepo(manager).save(subscription);
  }

  findById(id: string, manager?: EntityManager): Promise<NotificationSubscription | null> {
    return this.getRepo(manager).findOne({ where: { id }, relations: ['user'] });
  }

  findByToken(token: string, manager?: EntityManager): Promise<NotificationSubscription | null> {
    return this.getRepo(manager).findOne({ where: { token }, relations: ['user'] });
  }

  findByUser(userId: string, manager?: EntityManager): Promise<NotificationSubscription[]> {
    return this.getRepo(manager).find({ where: { user: { id: userId } }, order: { createdAt: 'DESC' } });
  }

  async findByUserIds(userIds: string[], manager?: EntityManager): Promise<NotificationSubscription[]> {
    if (!userIds.length) {
      return [];
    }
    return this.getRepo(manager).find({ where: { user: { id: In(userIds) } } });
  }

  remove(subscription: NotificationSubscription, manager?: EntityManager): Promise<NotificationSubscription> {
    return this.getRepo(manager).remove(subscription);
  }

  async removeByTokens(tokens: string[], manager?: EntityManager): Promise<void> {
    if (!tokens.length) {
      return;
    }
    await this.getRepo(manager).delete({ token: In(tokens) });
  }
}
