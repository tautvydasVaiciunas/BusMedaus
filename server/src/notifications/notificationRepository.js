const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { config, logger } = require('../config');

class NotificationRepository {
  constructor(filePath = config.dataFile) {
    this.filePath = filePath;
    this.dir = path.dirname(filePath);
    this._chain = Promise.resolve();
  }

  async init() {
    await fsp.mkdir(this.dir, { recursive: true });
    try {
      await fsp.access(this.filePath, fs.constants.F_OK);
    } catch (err) {
      await fsp.writeFile(this.filePath, '[]', 'utf8');
    }
  }

  async _withLock(fn) {
    const next = this._chain.then(() => fn());
    this._chain = next.then(
      () => undefined,
      () => undefined
    );
    return next;
  }

  async _readAll() {
    const raw = await fsp.readFile(this.filePath, 'utf8');
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch (err) {
      logger.error('Failed to parse notifications store', { error: err.message });
      return [];
    }
  }

  async _writeAll(list) {
    await fsp.writeFile(this.filePath, JSON.stringify(list, null, 2), 'utf8');
  }

  async listByUser(userId) {
    return this._withLock(async () => {
      const items = await this._readAll();
      return items
        .filter((item) => item.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
  }

  async getById(id) {
    return this._withLock(async () => {
      const items = await this._readAll();
      return items.find((item) => item.id === id) || null;
    });
  }

  async save(notification) {
    return this._withLock(async () => {
      const items = await this._readAll();
      items.push(notification);
      await this._writeAll(items);
      return notification;
    });
  }

  async markAsRead(id, readAt = new Date().toISOString()) {
    return this._withLock(async () => {
      const items = await this._readAll();
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) {
        return null;
      }
      items[index].readAt = readAt;
      await this._writeAll(items);
      return items[index];
    });
  }

  async updateDeliveryStatus(id, channel, status, error) {
    return this._withLock(async () => {
      const items = await this._readAll();
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) {
        return null;
      }
      const deliveries = items[index].deliveries || {};
      deliveries[channel] = {
        status,
        error: error || null,
        updatedAt: new Date().toISOString()
      };
      items[index].deliveries = deliveries;
      await this._writeAll(items);
      return items[index];
    });
  }
}

module.exports = { NotificationRepository };
