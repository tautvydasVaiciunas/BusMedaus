import { requireFields, validateEmail, validateStringLength, pick } from '../../common/utils/validators.js';
import HttpError from '../../common/utils/http-errors.js';
import UserRepository from './user.repository.js';

export class UserService {
  constructor(database) {
    this.database = database;
    this.users = new UserRepository(database);
  }

  async listUsers() {
    return this.users.getAll();
  }

  async getUserById(id) {
    const user = this.users.findById(id);
    if (!user) {
      throw HttpError.notFound('User not found');
    }
    return user;
  }

  async updateProfile(id, payload) {
    const allowedFields = ['name', 'metadata'];
    const updates = pick(payload, allowedFields);
    if (updates.name) {
      validateStringLength(updates.name, 'name', 1, 120);
    }
    return this.database.transaction(async (ctx) => {
      const existing = this.users.findById(id, ctx);
      if (!existing) {
        throw HttpError.notFound('User not found');
      }
      const updated = this.users.updateUser(id, updates, ctx);
      return updated;
    });
  }

  async changeRole(id, role) {
    const allowed = ['ADMIN', 'BEEKEEPER', 'MEMBER'];
    if (!allowed.includes(role)) {
      throw HttpError.badRequest('Invalid role specified');
    }
    return this.database.transaction(async (ctx) => {
      const existing = this.users.findById(id, ctx);
      if (!existing) {
        throw HttpError.notFound('User not found');
      }
      return this.users.updateUser(id, { role }, ctx);
    });
  }

  async deleteUser(id) {
    return this.database.transaction(async (ctx) => {
      const existing = this.users.findById(id, ctx);
      if (!existing) {
        throw HttpError.notFound('User not found');
      }
      this.users.delete(id, ctx);
      return { success: true };
    });
  }

  async createUser(payload) {
    requireFields(payload, ['email', 'passwordHash']);
    validateEmail(payload.email);
    if (payload.name) {
      validateStringLength(payload.name, 'name', 1, 120);
    }
    return this.database.transaction(async (ctx) => {
      const existing = this.users.findByEmail(payload.email, ctx);
      if (existing) {
        throw HttpError.conflict('Email already registered');
      }
      return this.users.create(payload, ctx);
    });
  }
}

export default UserService;
