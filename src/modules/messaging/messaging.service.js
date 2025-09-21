import { requireFields, validateStringLength } from '../../common/utils/validators.js';
import HttpError from '../../common/utils/http-errors.js';
import ThreadRepository from './thread.repository.js';
import MessageRepository from './message.repository.js';
import UserRepository from '../users/user.repository.js';

export class MessagingService {
  constructor(database) {
    this.database = database;
    this.threads = new ThreadRepository(database);
    this.messages = new MessageRepository(database);
    this.users = new UserRepository(database);
  }

  async listThreadsForUser(userId) {
    return this.threads
      .getAll()
      .filter((thread) => thread.participants.includes(userId) || thread.createdBy === userId);
  }

  async createThread(payload, user) {
    requireFields(payload, ['participants']);
    const participants = Array.from(new Set([...(payload.participants || []), user?.id].filter(Boolean)));
    if (!participants.length) {
      throw HttpError.badRequest('Thread must include at least one participant');
    }
    if (payload.subject) {
      validateStringLength(payload.subject, 'subject', 1, 200);
    }

    return this.database.transaction(async (ctx) => {
      for (const participant of participants) {
        const existing = this.users.findById(participant, ctx);
        if (!existing) {
          throw HttpError.notFound(`Participant ${participant} not found`);
        }
      }
      const thread = this.threads.create(
        {
          subject: payload.subject,
          participants,
          createdBy: user?.id || null,
        },
        ctx,
      );
      if (payload.message) {
        await this.messages.create(
          {
            threadId: thread.id,
            senderId: user?.id || null,
            body: payload.message,
          },
          ctx,
        );
      }
      return thread;
    });
  }

  async postMessage(threadId, body, user) {
    validateStringLength(body, 'body', 1, 4000);
    return this.database.transaction(async (ctx) => {
      const thread = this.threads.findById(threadId, ctx);
      if (!thread) {
        throw HttpError.notFound('Thread not found');
      }
      if (user && !thread.participants.includes(user.id) && thread.createdBy !== user.id) {
        throw HttpError.forbidden('Not a participant in this thread');
      }
      const message = this.messages.create(
        {
          threadId,
          senderId: user?.id || null,
          body,
        },
        ctx,
      );
      this.threads.update(
        threadId,
        {
          updatedAt: new Date().toISOString(),
        },
        ctx,
      );
      return message;
    });
  }

  async listMessages(threadId, user) {
    const thread = this.threads.findById(threadId);
    if (!thread) {
      throw HttpError.notFound('Thread not found');
    }
    if (user && !thread.participants.includes(user.id) && thread.createdBy !== user.id) {
      throw HttpError.forbidden('Not a participant in this thread');
    }
    return this.messages.findByThread(threadId);
  }
}

export default MessagingService;
