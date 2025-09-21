import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Notification } from './notification.entity';
import { NotificationsService } from './notifications.service';

interface NotificationResponse {
  id: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function mapNotification(notification: Notification): NotificationResponse {
  return {
    id: notification.id,
    message: notification.message,
    metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
    read: notification.read,
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
