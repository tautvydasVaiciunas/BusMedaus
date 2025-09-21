import BaseRepository from '../../database/base-repository.js';

export class MediaRepository extends BaseRepository {
  constructor(database) {
    super(database, 'media');
  }

  create(payload, context) {
    const now = new Date().toISOString();
    const media = {
      id: this.database.generateId(),
      ownerId: payload.ownerId || null,
      hiveId: payload.hiveId || null,
      taskId: payload.taskId || null,
      uri: payload.uri,
      description: payload.description || '',
      metadata: payload.metadata || {},
      createdAt: now,
    };
    return this.save(media, context);
  }

  findByOwner(ownerId, context) {
    return this.getAll(context).filter((item) => item.ownerId === ownerId);
  }
}

export default MediaRepository;
