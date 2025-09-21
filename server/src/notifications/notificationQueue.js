const EventEmitter = require('events');
const { logger } = require('../config');

class NotificationQueue extends EventEmitter {
  constructor({ concurrency = 2 } = {}) {
    super();
    this.concurrency = Math.max(1, concurrency);
    this.queue = [];
    this.active = 0;
    this.processor = null;
  }

  async enqueue(job) {
    this.queue.push(job);
    this.emit('enqueued', job);
    this.processNext();
  }

  process(processor) {
    this.processor = processor;
    this.processNext();
  }

  processNext() {
    if (!this.processor) {
      return;
    }
    while (this.active < this.concurrency && this.queue.length > 0) {
      const job = this.queue.shift();
      this.active += 1;
      Promise.resolve()
        .then(() => this.processor(job))
        .then(() => {
          this.active -= 1;
          this.emit('completed', job);
          this.processNext();
        })
        .catch((err) => {
          this.active -= 1;
          logger.error('Notification job failed', { error: err.message });
          this.emit('failed', job, err);
          this.processNext();
        });
    }
  }
}

module.exports = { NotificationQueue };
