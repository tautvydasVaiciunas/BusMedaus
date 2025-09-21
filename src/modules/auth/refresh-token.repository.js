import BaseRepository from '../../database/base-repository.js';

export class RefreshTokenRepository extends BaseRepository {
  constructor(database) {
    super(database, 'refreshTokens');
  }

  createToken(payload, context) {
    const now = new Date().toISOString();
    const entity = {
      id: this.database.generateId(),
      userId: payload.userId,
      tokenHash: payload.tokenHash,
      expiresAt: payload.expiresAt,
      createdAt: now,
      createdByIp: payload.createdByIp || null,
      revokedAt: null,
      revokedByIp: null,
      replacedBy: null,
      userAgent: payload.userAgent || null,
    };
    return this.save(entity, context);
  }

  revokeToken(id, context, metadata = {}) {
    return this.update(
      id,
      {
        revokedAt: new Date().toISOString(),
        revokedByIp: metadata.ip || null,
        replacedBy: metadata.replacedBy || null,
      },
      context,
    );
  }

  deleteTokensByUser(userId, context) {
    const store = this.getStore(context);
    for (const [id, token] of store.entries()) {
      if (token.userId === userId) {
        store.delete(id);
      }
    }
  }

  findValidTokensByUser(userId, context) {
    const now = new Date();
    return this.getAll(context).filter((token) => !token.revokedAt && new Date(token.expiresAt) > now && token.userId === userId);
  }
}

export default RefreshTokenRepository;
