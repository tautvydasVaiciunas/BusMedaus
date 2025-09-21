import BaseRepository from '../../database/base-repository.js';

export class CommentRepository extends BaseRepository {
  constructor(database) {
    super(database, 'comments');
  }

  create(payload, context) {
    const now = new Date().toISOString();
    const comment = {
      id: this.database.generateId(),
      taskId: payload.taskId,
      authorId: payload.authorId,
      body: payload.body,
      createdAt: now,
    };
    return this.save(comment, context);
  }

  findByTask(taskId, context) {
    return this.getAll(context).filter((comment) => comment.taskId === taskId);
  }
}

export default CommentRepository;
