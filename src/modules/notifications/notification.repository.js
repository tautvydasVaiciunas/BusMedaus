import BaseRepository from '../../database/base-repository.js';

export class NotificationRepository extends BaseRepository {
  constructor(database) {
    super(database, 'notifications');
  }

  create(payload, context) {
    const now = new Date().toISOString();
    const notification = {
      id: this.database.generateId(),
      userId: payload.userId,
      message: payload.message,
      type: payload.type || 'INFO',
      readAt: null,
      metadata: payload.metadata || {},
      createdAt: now,
    };
    return this.save(notification, context);
  }

  markAsRead(id, context) {
    return this.update(
      id,
      {
        readAt: new Date().toISOString(),
      },
      context,
    );
  }

  findByUser(userId, context) {
    return this.getAll(context).filter((notification) => notification.userId === userId);
  }
}

export default NotificationRepository;
