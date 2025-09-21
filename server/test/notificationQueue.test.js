const test = require('node:test');
const assert = require('node:assert');
const { NotificationQueue } = require('../src/notifications/notificationQueue');

test('NotificationQueue processes jobs', async () => {
  const queue = new NotificationQueue({ concurrency: 1 });
  const processed = [];
  queue.process(async (job) => {
    processed.push(job.value);
  });
  await queue.enqueue({ value: 1 });
  await queue.enqueue({ value: 2 });

  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.deepStrictEqual(processed, [1, 2]);
});
