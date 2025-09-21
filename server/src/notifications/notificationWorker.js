const { logger } = require('../config');

class NotificationWorker {
  constructor(queue, repository, emailProvider, pushProvider) {
    this.queue = queue;
    this.repository = repository;
    this.emailProvider = emailProvider;
    this.pushProvider = pushProvider;
    this.started = false;
  }

  start() {
    if (this.started) {
      return;
    }
    this.started = true;
    this.queue.process((job) => this.handleJob(job));
  }

  async handleJob(job) {
    const { notificationId, deliveryTargets, title, body, metadata, userId } = job;
    const results = {};

    if (deliveryTargets.email) {
      const subject = deliveryTargets.email.subject || title;
      const text = body;
      const response = await this.emailProvider.sendEmail({
        to: deliveryTargets.email.to,
        subject,
        text,
        html: metadata.html || null
      });
      results.email = response;
      await this.repository.updateDeliveryStatus(
        notificationId,
        'email',
        response.status,
        response.error
      );
    }

    if (deliveryTargets.push) {
      const response = await this.pushProvider.sendPush({
        tokens: deliveryTargets.push.tokens,
        notification: {
          title,
          body
        },
        data: metadata
      });
      results.push = response;
      await this.repository.updateDeliveryStatus(
        notificationId,
        'push',
        response.status,
        response.error
      );
    }

    logger.debug('Processed notification job', { notificationId, userId, results });
  }
}

module.exports = { NotificationWorker };
