import { randomUUID } from 'crypto';

export class InMemoryDatabase {
  constructor() {
    this.stores = {
      users: new Map(),
      hives: new Map(),
      tasks: new Map(),
      comments: new Map(),
      notifications: new Map(),
      messages: new Map(),
      media: new Map(),
      refreshTokens: new Map(),
      auditLogs: new Map(),
      threads: new Map(),
    };
  }

  generateId() {
    return randomUUID();
  }

  getStore(name, context) {
    if (context && context.stores && context.stores[name]) {
      return context.stores[name];
    }
    return this.stores[name];
  }

  cloneStores() {
    const cloned = {};
    for (const [name, store] of Object.entries(this.stores)) {
      cloned[name] = new Map();
      for (const [key, value] of store.entries()) {
        cloned[name].set(key, structuredClone(value));
      }
    }
    return cloned;
  }

  applyStores(newStores) {
    for (const [name, store] of Object.entries(newStores)) {
      this.stores[name].clear();
      for (const [key, value] of store.entries()) {
        this.stores[name].set(key, value);
      }
    }
  }

  async transaction(work) {
    const context = {
      id: randomUUID(),
      createdAt: new Date(),
      stores: this.cloneStores(),
    };
    const result = await work(context);
    this.applyStores(context.stores);
    return result;
  }
}

export default InMemoryDatabase;
