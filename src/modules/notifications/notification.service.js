import { requireFields, validateStringLength } from '../../common/utils/validators.js';
import HttpError from '../../common/utils/http-errors.js';
import NotificationRepository from './notification.repository.js';
import UserRepository from '../users/user.repository.js';

const NOTIFICATION_TYPES = ['INFO', 'ALERT', 'REMINDER'];

export class NotificationService {
  constructor(database) {
    this.database = database;
    this.notifications = new NotificationRepository(database);
    this.users = new UserRepository(database);
  }

  async listForUser(userId) {
    return this.notifications.findByUser(userId);
  }

  async createNotification(payload) {
    requireFields(payload, ['userId', 'message']);
    validateStringLength(payload.message, 'message', 1, 500);
    if (payload.type && !NOTIFICATION_TYPES.includes(payload.type)) {
      throw HttpError.badRequest('Invalid notification type');
    }
    return this.database.transaction(async (ctx) => {
      const user = this.users.findById(payload.userId, ctx);
      if (!user) {
        throw HttpError.notFound('User not found');
      }
      return this.notifications.create(payload, ctx);
    });
  }

  async markAsRead(notificationId, userId) {
    return this.database.transaction(async (ctx) => {
      const notification = this.notifications.findById(notificationId, ctx);
      if (!notification) {
        throw HttpError.notFound('Notification not found');
      }
      if (notification.userId !== userId) {
        throw HttpError.forbidden('Cannot modify another user\'s notification');
      }
      return this.notifications.markAsRead(notificationId, ctx);
    });
  }
}

export default NotificationService;
