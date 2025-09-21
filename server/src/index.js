const { config, logger } = require('./config');
const { SecretManager } = require('./secrets/secretManager');
const { SendGridEmailProvider } = require('./providers/sendgridEmailProvider');
const { FirebasePushProvider } = require('./providers/firebasePushProvider');
const { NotificationRepository } = require('./notifications/notificationRepository');
const { NotificationQueue } = require('./notifications/notificationQueue');
const { NotificationService } = require('./notifications/notificationService');
const { NotificationWorker } = require('./notifications/notificationWorker');
const { registerNotificationEventHandlers } = require('./eventHandlers/notificationEventHandler');
const { createServer } = require('./app');
const { NotificationGateway } = require('./websocket/notificationGateway');

async function bootstrap() {
  const secretManager = new SecretManager();
  const repository = new NotificationRepository(config.dataFile);
  await repository.init();
  const queue = new NotificationQueue({ concurrency: config.worker.concurrency });

  const emailProvider = new SendGridEmailProvider(config.sendgrid, secretManager);
  const pushProvider = new FirebasePushProvider(config.firebase, secretManager);

  const notificationService = new NotificationService(repository, queue);
  const worker = new NotificationWorker(queue, repository, emailProvider, pushProvider);
  worker.start();

  registerNotificationEventHandlers(notificationService);

  const server = createServer(notificationService);
  const gateway = new NotificationGateway(server, notificationService);
  notificationService.setRealtimeGateway(gateway);

  server.listen(config.port, () => {
    logger.info(`Notification API listening on port ${config.port}`);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to bootstrap notification service', { error: err.message });
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled promise rejection', { error: err?.message || err });
});

process.on('SIGINT', () => {
  logger.info('Shutting down notification service');
  process.exit(0);
});
