import { requireFields, validateEnum, validateStringLength } from '../../common/utils/validators.js';
import HttpError from '../../common/utils/http-errors.js';
import HiveRepository from './hive.repository.js';

const HIVE_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];

export class HiveService {
  constructor(database) {
    this.database = database;
    this.hives = new HiveRepository(database);
  }

  async listHives() {
    return this.hives.getAll();
  }

  async getHiveById(id) {
    const hive = this.hives.findById(id);
    if (!hive) {
      throw HttpError.notFound('Hive not found');
    }
    return hive;
  }

  async createHive(payload, user) {
    requireFields(payload, ['name']);
    validateStringLength(payload.name, 'name', 3, 120);
    if (payload.status) {
      validateEnum(payload.status, HIVE_STATUSES, 'status');
    }
    return this.database.transaction(async (ctx) => {
      return this.hives.create(
        {
          ...payload,
          status: payload.status || 'ACTIVE',
          createdBy: user?.id || null,
          updatedBy: user?.id || null,
        },
        ctx,
      );
    });
  }

  async updateHive(id, payload, user) {
    if (payload.name) {
      validateStringLength(payload.name, 'name', 3, 120);
    }
    if (payload.status) {
      validateEnum(payload.status, HIVE_STATUSES, 'status');
    }
    return this.database.transaction(async (ctx) => {
      const existing = this.hives.findById(id, ctx);
      if (!existing) {
        throw HttpError.notFound('Hive not found');
      }
      return this.hives.updateHive(
        id,
        {
          ...payload,
          updatedBy: user?.id || null,
        },
        ctx,
      );
    });
  }

  async deleteHive(id) {
    return this.database.transaction(async (ctx) => {
      const existing = this.hives.findById(id, ctx);
      if (!existing) {
        throw HttpError.notFound('Hive not found');
      }
      this.hives.delete(id, ctx);
      return { success: true };
    });
  }
}

export default HiveService;
