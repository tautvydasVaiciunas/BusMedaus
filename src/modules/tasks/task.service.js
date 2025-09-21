import {
  requireFields,
  validateEnum,
  validateOptionalDate,
  validateStringLength,
} from '../../common/utils/validators.js';
import HttpError from '../../common/utils/http-errors.js';
import TaskRepository from './task.repository.js';
import HiveRepository from '../hives/hive.repository.js';
import UserRepository from '../users/user.repository.js';
import CommentRepository from '../comments/comment.repository.js';

const TASK_STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'ARCHIVED'];

export class TaskService {
  constructor(database) {
    this.database = database;
    this.tasks = new TaskRepository(database);
    this.hives = new HiveRepository(database);
    this.users = new UserRepository(database);
    this.comments = new CommentRepository(database);
  }

  async listTasksForHive(hiveId) {
    return this.tasks.findByHive(hiveId);
  }

  async getTaskById(taskId) {
    const task = this.tasks.findById(taskId);
    if (!task) {
      throw HttpError.notFound('Task not found');
    }
    return task;
  }

  async createTask(hiveId, payload, user) {
    requireFields(payload, ['title']);
    validateStringLength(payload.title, 'title', 3, 160);
    if (payload.description) {
      validateStringLength(payload.description, 'description', 0, 2000);
    }
    if (payload.dueDate) {
      validateOptionalDate(payload.dueDate, 'dueDate');
    }
    if (payload.status) {
      validateEnum(payload.status, TASK_STATUSES, 'status');
    }

    return this.database.transaction(async (ctx) => {
      const hive = this.hives.findById(hiveId, ctx);
      if (!hive) {
        throw HttpError.notFound('Hive not found');
      }
      let assignee = null;
      if (payload.assignedTo) {
        assignee = this.users.findById(payload.assignedTo, ctx);
        if (!assignee) {
          throw HttpError.notFound('Assigned user not found');
        }
      }
      const task = this.tasks.create(
        {
          hiveId,
          title: payload.title,
          description: payload.description,
          status: payload.status || 'OPEN',
          assignedTo: assignee ? assignee.id : null,
          dueDate: payload.dueDate || null,
          createdBy: user?.id || null,
          updatedBy: user?.id || null,
        },
        ctx,
      );
      return task;
    });
  }

  async updateTask(taskId, payload, user) {
    if (payload.title) {
      validateStringLength(payload.title, 'title', 3, 160);
    }
    if (payload.description) {
      validateStringLength(payload.description, 'description', 0, 2000);
    }
    if (payload.dueDate) {
      validateOptionalDate(payload.dueDate, 'dueDate');
    }

    return this.database.transaction(async (ctx) => {
      const task = this.tasks.findById(taskId, ctx);
      if (!task) {
        throw HttpError.notFound('Task not found');
      }
      let assignedTo = task.assignedTo;
      if (payload.assignedTo) {
        const assignee = this.users.findById(payload.assignedTo, ctx);
        if (!assignee) {
          throw HttpError.notFound('Assigned user not found');
        }
        assignedTo = assignee.id;
      }
      const updated = this.tasks.updateTask(
        taskId,
        {
          title: payload.title || task.title,
          description: payload.description ?? task.description,
          dueDate: payload.dueDate ?? task.dueDate,
          assignedTo,
          updatedBy: user?.id || null,
        },
        ctx,
      );
      return updated;
    });
  }

  async updateStatus(taskId, status, user) {
    validateEnum(status, TASK_STATUSES, 'status');
    return this.database.transaction(async (ctx) => {
      const task = this.tasks.findById(taskId, ctx);
      if (!task) {
        throw HttpError.notFound('Task not found');
      }
      const updated = this.tasks.updateTask(
        taskId,
        {
          status,
          updatedBy: user?.id || null,
        },
        ctx,
      );
      return updated;
    });
  }

  async addComment(taskId, body, user) {
    validateStringLength(body, 'body', 1, 1000);
    return this.database.transaction(async (ctx) => {
      const task = this.tasks.findById(taskId, ctx);
      if (!task) {
        throw HttpError.notFound('Task not found');
      }
      const comment = this.comments.create(
        {
          taskId,
          authorId: user?.id || null,
          body,
        },
        ctx,
      );
      return comment;
    });
  }

  async listComments(taskId) {
    return this.comments.findByTask(taskId);
  }
}

export default TaskService;
