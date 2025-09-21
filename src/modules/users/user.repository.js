import BaseRepository from '../../database/base-repository.js';

export class UserRepository extends BaseRepository {
  constructor(database) {
    super(database, 'users');
  }

  create(payload, context) {
    const now = new Date().toISOString();
    const user = {
      id: this.database.generateId(),
      email: payload.email,
      passwordHash: payload.passwordHash,
      role: payload.role || 'MEMBER',
      name: payload.name || '',
      metadata: payload.metadata || {},
      createdAt: now,
      updatedAt: now,
    };
    return this.save(user, context);
  }

  findByEmail(email, context) {
    const store = this.getStore(context);
    for (const user of store.values()) {
      if (user.email === email) {
        return structuredClone(user);
      }
    }
    return null;
  }

  updateUser(id, updates, context) {
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

export default UserRepository;
