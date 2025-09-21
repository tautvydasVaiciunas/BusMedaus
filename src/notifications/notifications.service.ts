import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UsersService } from '../users/users.service';
import { Notification } from './notification.entity';
import { NotificationsRepository } from './notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource
  ) {}

  async notifyUsers(
    userIds: string[],
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<Notification[]> {
    if (!userIds.length) {
      return [];
    }

    const notifications: Notification[] = [];
    await this.dataSource.transaction(async (manager) => {
      for (const userId of userIds) {
        const user = await this.usersService.findByIdOrFail(userId, manager);
        const notification = this.notificationsRepository.create(
          {
            user,
            message,
            metadata: metadata ? JSON.stringify(metadata) : undefined,
            read: false
          },
          manager
        );
        notifications.push(await this.notificationsRepository.save(notification, manager));
      }
    });

    return notifications;
  }

  listNotificationsForUser(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.findByUser(userId);
  }

  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    return this.dataSource.transaction(async (manager) => {
      const notification = await this.notificationsRepository.findById(notificationId, manager);
      if (!notification || notification.user.id !== userId) {
        throw new NotFoundException('Notification not found');
      }
      notification.read = true;
      return this.notificationsRepository.save(notification, manager);
    });
  }
}
