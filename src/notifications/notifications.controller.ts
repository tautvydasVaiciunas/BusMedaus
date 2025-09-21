import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Notification, NotificationDeliveryMap } from './notification.entity';
import { NotificationSubscription } from './notification-subscription.entity';
import { NotificationsService } from './notifications.service';
import { CreateNotificationSubscriptionDto } from './dto/create-notification-subscription.dto';

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
  deliveryMetadata?: NotificationDeliveryMap | null;
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
    updatedAt: notification.updatedAt,
    deliveryMetadata: notification.deliveryMetadata ?? null
  };
}

interface NotificationSubscriptionResponse {
  id: string;
  token: string;
  platform: string;
  metadata?: Record<string, unknown> | null;
  lastUsedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapSubscription(subscription: NotificationSubscription): NotificationSubscriptionResponse {
  return {
    id: subscription.id,
    token: subscription.token,
    platform: subscription.platform,
    metadata: subscription.metadata ?? null,
    lastUsedAt: subscription.lastUsedAt ?? null,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt
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

  @Get('subscriptions')
  async listSubscriptions(@CurrentUser() user: AuthenticatedUser): Promise<NotificationSubscriptionResponse[]> {
    const subscriptions = await this.notificationsService.listSubscriptionsForUser(user.userId);
    return subscriptions.map(mapSubscription);
  }

  @Post('subscriptions')
  async createSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateNotificationSubscriptionDto
  ): Promise<NotificationSubscriptionResponse> {
    const subscription = await this.notificationsService.registerSubscription(user.userId, {
      token: dto.token,
      platform: dto.platform,
      metadata: dto.metadata ?? undefined
    });
    return mapSubscription(subscription);
  }

  @Delete('subscriptions/:id')
  async deleteSubscription(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.notificationsService.removeSubscription(user.userId, id);
  }
}
