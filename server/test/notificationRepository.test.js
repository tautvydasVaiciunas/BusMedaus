const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { NotificationRepository } = require('../src/notifications/notificationRepository');

function createRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'notifications-'));
  const file = path.join(dir, 'store.json');
  const repo = new NotificationRepository(file);
  return { repo, dir, file };
}

test('NotificationRepository saves and lists notifications', async () => {
  const { repo, dir } = createRepo();
  await repo.init();
  const created = {
    id: 'n1',
    userId: 'user-1',
    type: 'task.assigned',
    title: 'Task assigned',
    body: 'Body',
    metadata: {},
    createdAt: new Date().toISOString(),
    readAt: null,
    deliveries: {},
    deliveryTargets: {}
  };
  await repo.save(created);
  const list = await repo.listByUser('user-1');
  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0].id, 'n1');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('markAsRead updates timestamp', async () => {
  const { repo, dir } = createRepo();
  await repo.init();
  const created = {
    id: 'n2',
    userId: 'user-1',
    type: 'task.assigned',
    title: 'Task assigned',
    body: 'Body',
    metadata: {},
    createdAt: new Date().toISOString(),
    readAt: null,
    deliveries: {},
    deliveryTargets: {}
  };
  await repo.save(created);
  const updated = await repo.markAsRead('n2', '2024-01-01T00:00:00.000Z');
  assert.strictEqual(updated.readAt, '2024-01-01T00:00:00.000Z');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('updateDeliveryStatus stores statuses', async () => {
  const { repo, dir } = createRepo();
  await repo.init();
  const created = {
    id: 'n3',
    userId: 'user-1',
    type: 'task.assigned',
    title: 'Task assigned',
    body: 'Body',
    metadata: {},
    createdAt: new Date().toISOString(),
    readAt: null,
    deliveries: {},
    deliveryTargets: {}
  };
  await repo.save(created);
  const updated = await repo.updateDeliveryStatus('n3', 'email', 'sent');
  assert.strictEqual(updated.deliveries.email.status, 'sent');
  fs.rmSync(dir, { recursive: true, force: true });
});
