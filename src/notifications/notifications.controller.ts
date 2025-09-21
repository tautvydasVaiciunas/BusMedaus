import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Notification } from './notification.entity';
import { NotificationsService } from './notifications.service';

interface NotificationResponse {
  id: string;
  title: string;
  body: string;
  channel: string;
  status: string;
  metadata?: Record<string, unknown> | null;
  relatedTaskId?: string;
  relatedInspectionId?: string;
  relatedHarvestId?: string;
  auditEventId?: string;
  sentAt?: Date | null;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapNotification(notification: Notification): NotificationResponse {
  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    channel: notification.channel,
    status: notification.status,
    metadata: notification.metadata ?? null,
    relatedTaskId: notification.relatedTaskId ?? undefined,
    relatedInspectionId: notification.relatedInspectionId ?? undefined,
    relatedHarvestId: notification.relatedHarvestId ?? undefined,
    auditEventId: notification.auditEventId ?? undefined,
    sentAt: notification.sentAt ?? null,
    readAt: notification.readAt ?? null,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt
  };
}

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser): Promise<NotificationResponse[]> {
    const notifications = await this.notificationsService.listNotificationsForUser(user.userId);
    return notifications.map(mapNotification);
  }

  @Patch(':id/read')
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ): Promise<NotificationResponse> {
    const notification = await this.notificationsService.markAsRead(user.userId, id);
    return mapNotification(notification);
  }
}
