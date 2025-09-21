const { logger } = require('../config');

class FirebasePushProvider {
  constructor(config, secretManager) {
    this.config = config;
    this.secretManager = secretManager;
    this.initialized = false;
    this.enabled = false;
  }

  initialize() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    try {
      this.serverKey = this.secretManager.getSecret(this.config.webPushKeySecret);
      this.projectId = this.config.projectId || this.secretManager.getSecret('FIREBASE_PROJECT_ID');
      this.enabled = Boolean(this.serverKey);
      if (!this.enabled) {
        logger.warn('Firebase push provider disabled; missing server key');
      }
    } catch (err) {
      logger.error('Failed to initialize Firebase push provider', { error: err.message });
      this.enabled = false;
    }
  }

  async sendPush({ tokens, notification, data }) {
    this.initialize();
    if (!this.enabled) {
      logger.info('Skipping push notification because provider is not configured');
      return { status: 'skipped' };
    }
    if (!tokens || tokens.length === 0) {
      logger.info('No device tokens registered for push notification delivery');
      return { status: 'skipped' };
    }
    const payload = {
      registration_ids: tokens,
      notification,
      data
    };
    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          Authorization: `key=${this.serverKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Firebase responded with ${response.status}: ${text}`);
      }
      const body = await response.json();
      return { status: 'sent', response: body };
    } catch (err) {
      logger.error('Failed to send push notification', { error: err.message });
      return { status: 'failed', error: err.message };
    }
  }
}

module.exports = { FirebasePushProvider };
