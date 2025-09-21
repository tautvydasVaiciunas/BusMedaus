import BaseRepository from '../../database/base-repository.js';

export class AuditRepository extends BaseRepository {
  constructor(database) {
    super(database, 'auditLogs');
  }

  record(entry, context) {
    const log = {
      id: this.database.generateId(),
      userId: entry.userId || null,
      action: entry.action,
      entity: entry.entity || null,
      entityId: entry.entityId || null,
      method: entry.method,
      path: entry.path,
      statusCode: entry.statusCode,
      ip: entry.ip || null,
      changes: entry.changes || null,
      createdAt: new Date().toISOString(),
    };
    return this.save(log, context);
  }
}

export default AuditRepository;
