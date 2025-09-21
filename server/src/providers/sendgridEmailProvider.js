const { logger } = require('../config');

class SendGridEmailProvider {
  constructor(config, secretManager) {
    this.config = config;
    this.secretManager = secretManager;
    this.enabled = false;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    try {
      this.apiKey = this.secretManager.getSecret(this.config.apiKeySecret);
      this.fromEmail = this.secretManager.getSecret(this.config.fromEmailSecret);
      this.enabled = Boolean(this.apiKey && this.fromEmail);
      if (!this.enabled) {
        logger.warn('SendGrid email provider disabled; missing credentials');
      }
    } catch (err) {
      this.enabled = false;
      logger.error('Failed to initialize SendGrid provider', { error: err.message });
    }
  }

  async sendEmail(message) {
    this.initialize();
    if (!this.enabled) {
      logger.info('Skipping email dispatch because provider is not configured', { to: message?.to });
      return { status: 'skipped' };
    }
    const payload = {
      personalizations: [
        {
          to: [{ email: message.to }]
        }
      ],
      from: { email: this.fromEmail },
      subject: message.subject,
      content: [
        {
          type: message.html ? 'text/html' : 'text/plain',
          value: message.html || message.text
        }
      ]
    };
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`SendGrid responded with ${response.status}: ${text}`);
      }
      return { status: 'sent' };
    } catch (err) {
      logger.error('Failed to send email via SendGrid', { error: err.message });
      return { status: 'failed', error: err.message };
    }
  }
}

module.exports = { SendGridEmailProvider };
