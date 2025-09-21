const fs = require('fs');
const path = require('path');
const { serverRoot, logger } = require('../config');

class SecretManager {
  constructor(options = {}) {
    this.cache = new Map();
    const defaultFile = path.join(serverRoot, 'config', 'secrets.json');
    this.secretFile = options.secretFile || defaultFile;
    this.fileSecrets = this.loadFileSecrets();
  }

  loadFileSecrets() {
    try {
      if (!fs.existsSync(this.secretFile)) {
        return {};
      }
      const raw = fs.readFileSync(this.secretFile, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      logger.warn('Unable to load secrets file', { file: this.secretFile, error: err.message });
      return {};
    }
  }

  refresh() {
    this.fileSecrets = this.loadFileSecrets();
    this.cache.clear();
  }

  getSecret(key) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    let value = process.env[key];
    if (!value && this.fileSecrets && key in this.fileSecrets) {
      value = this.fileSecrets[key];
    }
    if (value) {
      this.cache.set(key, value);
    }
    return value;
  }

  requireSecret(key) {
    const value = this.getSecret(key);
    if (!value) {
      throw new Error(`Missing secret for key ${key}`);
    }
    return value;
  }
}

module.exports = { SecretManager };
