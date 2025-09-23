import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { MailDataRequired, MailService } from '@sendgrid/mail';
import type { Messaging } from 'firebase-admin/messaging';
import { DataSource } from 'typeorm';
import { UsersService } from '../users/users.service';
import {
  Notification,
  NotificationChannel,
  NotificationDeliveryDetail,
  NotificationDeliveryMap,
  NotificationStatus
} from './notification.entity';
import { NotificationSubscription } from './notification-subscription.entity';
import { NotificationsRepository } from './notifications.repository';
import { NotificationSubscriptionsRepository } from './notification-subscriptions.repository';
import { FIREBASE_MESSAGING, SENDGRID_CLIENT, SENDGRID_FROM_EMAIL } from './notifications.constants';

export interface NotificationEmailOptions {
  subject?: string;
  text?: string;
  html?: string;
}

export interface NotificationPushOptions {
  title?: string;
  body?: string;
  data?: Record<string, string>;
}

export interface NotificationPayload {
  title: string;
  body: string;
  channel?: NotificationChannel;
  channels?: NotificationChannel[];
  status?: NotificationStatus;
  metadata?: Record<string, unknown>;
  relatedTaskId?: string;
  relatedInspectionId?: string;
  relatedHarvestId?: string;
  auditEventId?: string;
  sentAt?: Date;
  readAt?: Date;
  email?: NotificationEmailOptions;
  push?: NotificationPushOptions;
}

export interface NotificationSubscriptionPayload {
  token: string;
  platform?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly notificationSubscriptionsRepository: NotificationSubscriptionsRepository,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
    @Inject(SENDGRID_CLIENT) private readonly sendGridClient: MailService | null,
    @Inject(SENDGRID_FROM_EMAIL) private readonly sendGridFromEmail: string | null,
    @Inject(FIREBASE_MESSAGING) private readonly firebaseMessaging: Messaging | null
  ) {}

  async notifyUsers(userIds: string[], payload: NotificationPayload): Promise<Notification[]> {
    if (!userIds.length) {
      return [];
    }

    const channels = this.normalizeChannels(payload);
    const notifications: Notification[] = [];

    await this.dataSource.transaction(async (manager) => {
      for (const userId of userIds) {
        const user = await this.usersService.findByIdOrFail(userId, manager);
        const notification = this.notificationsRepository.create(
          {
            user,
            title: payload.title,
            body: payload.body,
            channel: channels[0],
            status: payload.status ?? NotificationStatus.PENDING,
            metadata: this.mergeMetadata(payload.metadata, channels),
            relatedTaskId: payload.relatedTaskId,
            relatedInspectionId: payload.relatedInspectionId,
            relatedHarvestId: payload.relatedHarvestId,
            auditEventId: payload.auditEventId,
            sentAt: payload.sentAt,
            readAt: payload.readAt ?? undefined
          },
          manager
        );
        notifications.push(await this.notificationsRepository.save(notification, manager));
      }
    });

    await Promise.all(notifications.map((notification) => this.dispatchTransports(notification, payload, channels)));

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

  listSubscriptionsForUser(userId: string): Promise<NotificationSubscription[]> {
    return this.notificationSubscriptionsRepository.findByUser(userId);
  }

  async registerSubscription(userId: string, payload: NotificationSubscriptionPayload): Promise<NotificationSubscription> {
    return this.dataSource.transaction(async (manager) => {
      const user = await this.usersService.findByIdOrFail(userId, manager);
      const now = new Date();
      let subscription = await this.notificationSubscriptionsRepository.findByToken(payload.token, manager);

      if (subscription) {
        subscription.user = user;
        subscription.platform = payload.platform ?? subscription.platform;
        subscription.metadata = payload.metadata ?? subscription.metadata ?? null;
        subscription.lastUsedAt = now;
      } else {
        subscription = this.notificationSubscriptionsRepository.create(
          {
            user,
            token: payload.token,
            platform: payload.platform ?? 'web',
            metadata: payload.metadata ?? null,
            lastUsedAt: now
          },
          manager
        );
      }

      return this.notificationSubscriptionsRepository.save(subscription, manager);
    });
  }

  async removeSubscription(userId: string, subscriptionId: string): Promise<void> {
    const removed = await this.dataSource.transaction(async (manager) => {
      const subscription = await this.notificationSubscriptionsRepository.findById(subscriptionId, manager);
      if (!subscription || subscription.user.id !== userId) {
        return false;
      }
      await this.notificationSubscriptionsRepository.remove(subscription, manager);
      return true;
    });

    if (!removed) {
      throw new NotFoundException('Subscription not found');
    }
  }

  private normalizeChannels(payload: NotificationPayload): NotificationChannel[] {
    const channels = payload.channels?.length
      ? [...new Set(payload.channels)]
      : payload.channel
      ? [payload.channel]
      : [NotificationChannel.IN_APP];

    if (!channels.includes(NotificationChannel.IN_APP)) {
      channels.unshift(NotificationChannel.IN_APP);
    }

    return channels;
  }

  private mergeMetadata(
    metadata: Record<string, unknown> | undefined,
    channels: NotificationChannel[]
  ): Record<string, unknown> | null {
    if (!metadata && !channels.length) {
      return null;
    }

    const merged: Record<string, unknown> = { channels };
    if (metadata) {
      for (const [key, value] of Object.entries(metadata)) {
        merged[key] = value;
      }
    }

    return merged;
  }

  private async dispatchTransports(
    notification: Notification,
    payload: NotificationPayload,
    channels: NotificationChannel[]
  ): Promise<void> {
    const deliveryMetadata: NotificationDeliveryMap = {
      [NotificationChannel.IN_APP]: {
        status: NotificationStatus.SENT,
        attempts: 1,
        lastAttemptAt: new Date().toISOString()
      }
    };

    const deliveryResults: NotificationDeliveryDetail[] = [];

    if (channels.includes(NotificationChannel.EMAIL)) {
      const result = await this.deliverEmail(notification, payload);
      deliveryMetadata[NotificationChannel.EMAIL] = result;
      deliveryResults.push(result);
    }

    if (channels.includes(NotificationChannel.PUSH)) {
      const result = await this.deliverPush(notification, payload);
      deliveryMetadata[NotificationChannel.PUSH] = result;
      deliveryResults.push(result);
    }

    const hasSuccess =
      deliveryResults.some((result) => result.status === NotificationStatus.SENT) ||
      deliveryMetadata[NotificationChannel.IN_APP]?.status === NotificationStatus.SENT;

    notification.deliveryMetadata = deliveryMetadata;
    if (hasSuccess) {
      notification.status = NotificationStatus.SENT;
      notification.sentAt = notification.sentAt ?? new Date();
    } else {
      notification.status = NotificationStatus.FAILED;
    }

    await this.notificationsRepository.save(notification);
  }

  private async deliverEmail(notification: Notification, payload: NotificationPayload): Promise<NotificationDeliveryDetail> {
    const attemptTimestamp = new Date().toISOString();

    if (!this.sendGridClient) {
      this.logger.warn('Email transport skipped because SendGrid client is not configured.');
      return {
        status: NotificationStatus.FAILED,
        attempts: 0,
        lastAttemptAt: attemptTimestamp,
        lastError: 'SendGrid client not configured'
      };
    }

    if (!this.sendGridFromEmail) {
      this.logger.warn('Email transport skipped because SENDGRID_FROM_EMAIL is not configured.');
      return {
        status: NotificationStatus.FAILED,
        attempts: 0,
        lastAttemptAt: attemptTimestamp,
        lastError: 'SendGrid sender not configured'
      };
    }

    const message: MailDataRequired = {
      to: notification.user.email,
      from: this.sendGridFromEmail,
      subject: payload.email?.subject ?? payload.title,
      text: payload.email?.text ?? payload.body,
      customArgs: {
        notificationId: notification.id
      }
    };

    if (payload.email?.html) {
      message.html = payload.email.html;
    }

    try {
      const [response] = await this.sendGridClient.send(message);
      const providerMessageIdHeader = response.headers?.['x-message-id'];
      const providerMessageId = Array.isArray(providerMessageIdHeader)
        ? providerMessageIdHeader[0]
        : providerMessageIdHeader;

      return {
        status: NotificationStatus.SENT,
        attempts: 1,
        lastAttemptAt: attemptTimestamp,
        providerMessageId: providerMessageId ?? undefined,
        extra: {
          statusCode: response.statusCode
        }
      };
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Unknown error sending email';
      this.logger.error(`Failed to send email notification ${notification.id}`, error instanceof Error ? error.stack : undefined);
      return {
        status: NotificationStatus.FAILED,
        attempts: 1,
        lastAttemptAt: attemptTimestamp,
        lastError: messageText
      };
    }
  }

  private async deliverPush(notification: Notification, payload: NotificationPayload): Promise<NotificationDeliveryDetail> {
    const attemptTimestamp = new Date().toISOString();

    if (!this.firebaseMessaging) {
      this.logger.warn('Push transport skipped because Firebase messaging is not configured.');
      return {
        status: NotificationStatus.FAILED,
        attempts: 0,
        lastAttemptAt: attemptTimestamp,
        lastError: 'Firebase messaging not configured'
      };
    }

    const subscriptions = await this.notificationSubscriptionsRepository.findByUser(notification.user.id);
    const tokens = subscriptions.map((subscription) => subscription.token);

    if (!tokens.length) {
      this.logger.warn(`Push transport skipped because user ${notification.user.id} has no subscriptions.`);
      return {
        status: NotificationStatus.FAILED,
        attempts: 0,
        lastAttemptAt: attemptTimestamp,
        lastError: 'No push subscriptions registered'
      };
    }

    try {
      const response = await this.firebaseMessaging.sendEachForMulticast({
        tokens,
        notification: {
          title: payload.push?.title ?? payload.title,
          body: payload.push?.body ?? payload.body
        },
        data: this.buildPushData(notification, payload)
      });

      type ResponseEntry = (typeof response)['responses'][number];

      const failureMessages = response.responses
        .map((result: ResponseEntry) => (result.success || !result.error ? null : result.error.message))
        .filter((value: string | null): value is string => Boolean(value));

      const invalidTokens = response.responses
        .map((result: ResponseEntry, index: number) => {
          if (result.success || !result.error) {
            return null;
          }
          return this.isInvalidToken(result.error.code) ? tokens[index] : null;
        })
        .filter((token: string | null): token is string => Boolean(token));

      if (invalidTokens.length) {
        await this.notificationSubscriptionsRepository.removeByTokens(invalidTokens);
      }

      return {
        status: response.successCount > 0 ? NotificationStatus.SENT : NotificationStatus.FAILED,
        attempts: 1,
        lastAttemptAt: attemptTimestamp,
        lastError: failureMessages.length ? failureMessages.join('; ') : undefined,
        extra: {
          successCount: response.successCount,
          failureCount: response.failureCount
        }
      };
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Unknown error sending push notification';
      this.logger.error(`Failed to send push notification ${notification.id}`, error instanceof Error ? error.stack : undefined);
      return {
        status: NotificationStatus.FAILED,
        attempts: 1,
        lastAttemptAt: attemptTimestamp,
        lastError: messageText
      };
    }
  }

  private buildPushData(notification: Notification, payload: NotificationPayload): Record<string, string> {
    const data: Record<string, string> = {
      notificationId: notification.id
    };

    if (payload.push?.data) {
      for (const [key, value] of Object.entries(payload.push.data)) {
        if (typeof value === 'string') {
          data[key] = value;
        }
      }
    }

    if (payload.metadata) {
      data.metadata = JSON.stringify(payload.metadata);
    }

    if (payload.relatedTaskId) {
      data.relatedTaskId = payload.relatedTaskId;
    }
    if (payload.relatedInspectionId) {
      data.relatedInspectionId = payload.relatedInspectionId;
    }
    if (payload.relatedHarvestId) {
      data.relatedHarvestId = payload.relatedHarvestId;
    }
    if (payload.auditEventId) {
      data.auditEventId = payload.auditEventId;
    }

    return data;
  }

  private isInvalidToken(code?: string | null): boolean {
    return (
      code === 'messaging/invalid-registration-token' ||
      code === 'messaging/registration-token-not-registered'
    );
  }
}
