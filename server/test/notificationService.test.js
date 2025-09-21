const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { NotificationRepository } = require('../src/notifications/notificationRepository');
const { NotificationQueue } = require('../src/notifications/notificationQueue');
const { NotificationService } = require('../src/notifications/notificationService');
const { NotificationWorker } = require('../src/notifications/notificationWorker');

function createRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'notifications-service-'));
  const file = path.join(dir, 'store.json');
  const repo = new NotificationRepository(file);
  return { repo, dir };
}

test('NotificationService stores notification and processes channels', async () => {
  const { repo, dir } = createRepo();
  await repo.init();
  const queue = new NotificationQueue({ concurrency: 1 });
  const service = new NotificationService(repo, queue);
  const emailProvider = {
    async sendEmail() {
      return { status: 'sent' };
    }
  };
  const pushProvider = {
    async sendPush() {
      return { status: 'sent' };
    }
  };
  const worker = new NotificationWorker(queue, repo, emailProvider, pushProvider);
  worker.start();

  await service.createNotification({
    userId: 'user-1',
    type: 'test',
    title: 'Sveiki',
    body: 'Turite naują pranešimą',
    metadata: { example: true },
    channels: {
      email: { to: 'user@example.com' },
      push: { tokens: ['token-1'] }
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 50));
  const list = await service.list('user-1');
  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0].deliveries.email.status, 'sent');
  assert.strictEqual(list[0].deliveries.push.status, 'sent');

  fs.rmSync(dir, { recursive: true, force: true });
});
