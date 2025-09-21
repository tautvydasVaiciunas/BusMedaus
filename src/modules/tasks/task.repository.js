import BaseRepository from '../../database/base-repository.js';

export class TaskRepository extends BaseRepository {
  constructor(database) {
    super(database, 'tasks');
  }

  create(payload, context) {
    const now = new Date().toISOString();
    const task = {
      id: this.database.generateId(),
      hiveId: payload.hiveId,
      title: payload.title,
      description: payload.description || '',
      status: payload.status || 'OPEN',
      assignedTo: payload.assignedTo || null,
      dueDate: payload.dueDate || null,
      createdBy: payload.createdBy || null,
      updatedBy: payload.updatedBy || null,
      createdAt: now,
      updatedAt: now,
    };
    return this.save(task, context);
  }

  updateTask(id, updates, context) {
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

  findByHive(hiveId, context) {
    return this.getAll(context).filter((task) => task.hiveId === hiveId);
  }
}

export default TaskRepository;
