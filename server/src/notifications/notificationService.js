const { randomUUID } = require('crypto');
const { NotificationQueue } = require('./notificationQueue');
const { logger } = require('../config');

function sanitize(notification) {
  const { deliveryTargets, ...rest } = notification;
  return rest;
}

class NotificationService {
  constructor(repository, queue = new NotificationQueue()) {
    this.repository = repository;
    this.queue = queue;
    this.gateway = null;
  }

  setRealtimeGateway(gateway) {
    this.gateway = gateway;
  }

  async list(userId) {
    const items = await this.repository.listByUser(userId);
    return items.map((item) => sanitize(item));
  }

  async markAsRead(userId, notificationId) {
    const notification = await this.repository.getById(notificationId);
    if (!notification || notification.userId !== userId) {
      return null;
    }
    const updated = await this.repository.markAsRead(notificationId);
    if (updated && this.gateway) {
      this.gateway.broadcast(userId, {
        type: 'notification_read',
        payload: sanitize(updated)
      });
    }
    return updated ? sanitize(updated) : null;
  }

  async createNotification({
    userId,
    type,
    title,
    body,
    metadata = {},
    channels = {}
  }) {
    const createdAt = new Date().toISOString();
    const id = randomUUID();
    const deliveries = {};
    const deliveryTargets = {};

    if (channels.email && channels.email.to) {
      deliveries.email = { status: 'pending', updatedAt: createdAt };
      deliveryTargets.email = { to: channels.email.to, subject: channels.email.subject || title };
    }
    if (channels.push && Array.isArray(channels.push.tokens) && channels.push.tokens.length > 0) {
      deliveries.push = { status: 'pending', updatedAt: createdAt };
      deliveryTargets.push = { tokens: channels.push.tokens };
    }

    const notification = {
      id,
      userId,
      type,
      title,
      body,
      metadata,
      createdAt,
      readAt: null,
      deliveries,
      deliveryTargets
    };

    await this.repository.save(notification);

    await this.queue.enqueue({
      notificationId: id,
      userId,
      title,
      body,
      metadata,
      deliveryTargets
    });

    if (this.gateway) {
      this.gateway.broadcast(userId, {
        type: 'notification_created',
        payload: sanitize(notification)
      });
    }

    return sanitize(notification);
  }
}

module.exports = { NotificationService, sanitize };
