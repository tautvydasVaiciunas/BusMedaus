import BaseRepository from '../../database/base-repository.js';

export class MessageRepository extends BaseRepository {
  constructor(database) {
    super(database, 'messages');
  }

  create(payload, context) {
    const now = new Date().toISOString();
    const message = {
      id: this.database.generateId(),
      threadId: payload.threadId,
      senderId: payload.senderId,
      body: payload.body,
      attachments: payload.attachments || [],
      createdAt: now,
    };
    return this.save(message, context);
  }

  findByThread(threadId, context) {
    return this.getAll(context).filter((message) => message.threadId === threadId);
  }
}

export default MessageRepository;
