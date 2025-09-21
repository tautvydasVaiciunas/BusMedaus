import { validatePagination } from '../../common/utils/validators.js';
import AuditRepository from './audit.repository.js';

export class AuditService {
  constructor(database) {
    this.database = database;
    this.repository = new AuditRepository(database);
  }

  async record(entry) {
    return this.database.transaction(async (ctx) => this.repository.record(entry, ctx));
  }

  async list(query = {}) {
    const { limit, page } = validatePagination(query);
    const all = this.repository.getAll();
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      data: all.slice(start, end),
      pagination: {
        page,
        limit,
        total: all.length,
      },
    };
  }
}

export default AuditService;
