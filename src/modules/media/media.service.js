import { requireFields, validateStringLength } from '../../common/utils/validators.js';
import HttpError from '../../common/utils/http-errors.js';
import MediaRepository from './media.repository.js';
import UserRepository from '../users/user.repository.js';
import HiveRepository from '../hives/hive.repository.js';
import TaskRepository from '../tasks/task.repository.js';

export class MediaService {
  constructor(database) {
    this.database = database;
    this.media = new MediaRepository(database);
    this.users = new UserRepository(database);
    this.hives = new HiveRepository(database);
    this.tasks = new TaskRepository(database);
  }

  async listAll() {
    return this.media.getAll();
  }

  async listForUser(userId) {
    return this.media.findByOwner(userId);
  }

  async createMedia(payload, user) {
    requireFields(payload, ['uri']);
    validateStringLength(payload.uri, 'uri', 3, 2048);
    if (payload.description) {
      validateStringLength(payload.description, 'description', 0, 1000);
    }
    return this.database.transaction(async (ctx) => {
      if (payload.ownerId) {
        const owner = this.users.findById(payload.ownerId, ctx);
        if (!owner) {
          throw HttpError.notFound('Owner not found');
        }
      }
      if (payload.hiveId) {
        const hive = this.hives.findById(payload.hiveId, ctx);
        if (!hive) {
          throw HttpError.notFound('Hive not found');
        }
      }
      if (payload.taskId) {
        const task = this.tasks.findById(payload.taskId, ctx);
        if (!task) {
          throw HttpError.notFound('Task not found');
        }
      }
      return this.media.create(
        {
          ...payload,
          ownerId: payload.ownerId || user?.id || null,
        },
        ctx,
      );
    });
  }

  async deleteMedia(id, user) {
    return this.database.transaction(async (ctx) => {
      const asset = this.media.findById(id, ctx);
      if (!asset) {
        throw HttpError.notFound('Media asset not found');
      }
      if (user.role !== 'ADMIN' && asset.ownerId !== user.id) {
        throw HttpError.forbidden('Only owners or admins can delete media');
      }
      this.media.delete(id, ctx);
      return { success: true };
    });
  }
}

export default MediaService;
