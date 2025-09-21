export class BaseRepository {
  constructor(database, storeName) {
    this.database = database;
    this.storeName = storeName;
  }

  getStore(context) {
    return this.database.getStore(this.storeName, context);
  }

  getAll(context) {
    return Array.from(this.getStore(context).values()).map((item) => structuredClone(item));
  }

  findById(id, context) {
    const entity = this.getStore(context).get(id);
    return entity ? structuredClone(entity) : null;
  }

  save(entity, context) {
    const store = this.getStore(context);
    store.set(entity.id, structuredClone(entity));
    return structuredClone(entity);
  }

  update(id, updater, context) {
    const store = this.getStore(context);
    const current = store.get(id);
    if (!current) {
      return null;
    }
    const next = { ...current, ...updater };
    store.set(id, structuredClone(next));
    return structuredClone(next);
  }

  delete(id, context) {
    return this.getStore(context).delete(id);
  }
}

export default BaseRepository;
