import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import sgMail, { MailService } from '@sendgrid/mail';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { UsersModule } from '../users/users.module';
import { Notification } from './notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';
import { NotificationSubscription } from './notification-subscription.entity';
import { NotificationSubscriptionsRepository } from './notification-subscriptions.repository';
import { FIREBASE_MESSAGING, SENDGRID_CLIENT, SENDGRID_FROM_EMAIL } from './notifications.constants';

const sendGridProvider = {
  provide: SENDGRID_CLIENT,
  useFactory: (): MailService | null => {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      return null;
    }
    try {
      sgMail.setApiKey(apiKey);
      return sgMail;
    } catch (error) {
      console.warn('Failed to initialise SendGrid client', error);
      return null;
    }
  }
};

const sendGridFromProvider = {
  provide: SENDGRID_FROM_EMAIL,
  useValue: process.env.SENDGRID_FROM_EMAIL || process.env.NOTIFICATIONS_FROM_EMAIL || null
};

const firebaseMessagingProvider = {
  provide: FIREBASE_MESSAGING,
  useFactory: (): Messaging | null => {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!projectId || !clientEmail || !privateKey) {
      return null;
    }

    try {
      // Convert escaped '\n' sequences into actual line breaks for Firebase credentials.
      const sanitizedPrivateKey = privateKey.replace(/\\n/g, '\n');
      const existing = getApps().find((app) => app.name === 'busmedaus-notifications');
      const app =
        existing ||
        initializeApp(
          {
            credential: cert({ projectId, clientEmail, privateKey: sanitizedPrivateKey })
          },
          'busmedaus-notifications'
        );

      return getMessaging(app);
    } catch (error) {
      console.warn('Failed to initialise Firebase messaging client', error);
      return null;
    }
  }
};

@Module({
  imports: [TypeOrmModule.forFeature([Notification, NotificationSubscription]), UsersModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    NotificationSubscriptionsRepository,
    sendGridProvider,
    sendGridFromProvider,
    firebaseMessagingProvider
  ],
  exports: [NotificationsService, NotificationsRepository, NotificationSubscriptionsRepository]
})
export class NotificationsModule {}
