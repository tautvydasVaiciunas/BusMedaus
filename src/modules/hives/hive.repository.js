import BaseRepository from '../../database/base-repository.js';

export class HiveRepository extends BaseRepository {
  constructor(database) {
    super(database, 'hives');
  }

  create(payload, context) {
    const now = new Date().toISOString();
    const hive = {
      id: this.database.generateId(),
      name: payload.name,
      location: payload.location || '',
      status: payload.status || 'ACTIVE',
      description: payload.description || '',
      createdBy: payload.createdBy || null,
      updatedBy: payload.updatedBy || null,
      createdAt: now,
      updatedAt: now,
    };
    return this.save(hive, context);
  }

  updateHive(id, updates, context) {
    const now = new Date().toISOString();
    return this.update(
      id,
      {
        ...updates,
        updatedAt: now,
      },
      context,
    );
  }
}

export default HiveRepository;
