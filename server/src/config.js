const fs = require('fs');
const path = require('path');
const { Logger } = require('./utils/logger');

const projectRoot = path.resolve(__dirname, '..', '..');
const serverRoot = path.resolve(__dirname, '..');
const logger = new Logger({ level: process.env.LOG_LEVEL || 'info' });

function parseEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      if (!line || line.trim().startsWith('#')) {
        return;
      }
      const idx = line.indexOf('=');
      if (idx === -1) {
        return;
      }
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    });
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.warn('Failed to parse env file', { filePath, error: err.message });
    }
  }
}

parseEnvFile(path.join(projectRoot, '.env'));
parseEnvFile(path.join(serverRoot, '.env'));

function readJsonIfExists(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.warn('Unable to read configuration file', { filePath, error: err.message });
    }
    return {};
  }
}

const providerConfig = readJsonIfExists(path.join(serverRoot, 'config', 'providers.json'));

function numberFromEnv(key, fallback) {
  const raw = process.env[key];
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function resolveDataFile() {
  if (process.env.NOTIFICATION_DATA_FILE) {
    return path.resolve(projectRoot, process.env.NOTIFICATION_DATA_FILE);
  }
  const dataDir = path.join(serverRoot, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'notifications.json');
}

const config = {
  port: numberFromEnv('PORT', 4000),
  worker: {
    concurrency: numberFromEnv('NOTIFICATION_WORKER_CONCURRENCY', 2)
  },
  sendgrid: {
    apiKeySecret: providerConfig?.sendgrid?.apiKeySecret || 'SENDGRID_API_KEY',
    fromEmailSecret: providerConfig?.sendgrid?.fromEmailSecret || 'SENDGRID_FROM_EMAIL'
  },
  firebase: {
    projectId: providerConfig?.firebase?.projectId || process.env.FIREBASE_PROJECT_ID || '',
    clientEmailSecret: providerConfig?.firebase?.clientEmailSecret || 'FIREBASE_CLIENT_EMAIL',
    privateKeySecret: providerConfig?.firebase?.privateKeySecret || 'FIREBASE_PRIVATE_KEY',
    webPushKeySecret: providerConfig?.firebase?.webPushKeySecret || 'FIREBASE_WEB_PUSH_KEY'
  },
  dataFile: resolveDataFile()
};

module.exports = { config, projectRoot, serverRoot, logger };
