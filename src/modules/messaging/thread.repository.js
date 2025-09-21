import BaseRepository from '../../database/base-repository.js';

export class ThreadRepository extends BaseRepository {
  constructor(database) {
    super(database, 'threads');
  }

  create(payload, context) {
    const now = new Date().toISOString();
    const thread = {
      id: this.database.generateId(),
      subject: payload.subject || '',
      participants: payload.participants || [],
      createdBy: payload.createdBy || null,
      createdAt: now,
      updatedAt: now,
    };
    return this.save(thread, context);
  }

  updateParticipants(id, participants, context) {
    return this.update(
      id,
      {
        participants,
        updatedAt: new Date().toISOString(),
      },
      context,
    );
  }
}

export default ThreadRepository;
