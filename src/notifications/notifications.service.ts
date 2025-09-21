import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UsersService } from '../users/users.service';
import { Notification } from './notification.entity';
import { NotificationsRepository } from './notifications.repository';
import { NotificationChannel, NotificationStatus } from './notification.entity';

export interface NotificationPayload {
  title: string;
  body: string;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  metadata?: Record<string, unknown>;
  relatedTaskId?: string;
  relatedInspectionId?: string;
  relatedHarvestId?: string;
  auditEventId?: string;
  sentAt?: Date;
  readAt?: Date;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource
  ) {}

  async notifyUsers(userIds: string[], payload: NotificationPayload): Promise<Notification[]> {
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
            title: payload.title,
            body: payload.body,
            channel: payload.channel ?? NotificationChannel.IN_APP,
            status: payload.status ?? NotificationStatus.PENDING,
            metadata: payload.metadata ?? null,
            relatedTaskId: payload.relatedTaskId,
            relatedInspectionId: payload.relatedInspectionId,
            relatedHarvestId: payload.relatedHarvestId,
            auditEventId: payload.auditEventId,
            sentAt: payload.sentAt,
            readAt: payload.readAt ?? null
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
      notification.status = NotificationStatus.READ;
      notification.readAt = new Date();
      return this.notificationsRepository.save(notification, manager);
    });
  }
}
