const http = require('http');
const { URL } = require('url');
const { domainEvents } = require('./domainEvents');
const { logger } = require('./config');

const allowedEventTypes = new Set(Object.values(domainEvents.EVENTS));

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        reject(new Error('Payload too large'));
        req.socket.destroy();
      }
    });
    req.on('end', () => {
      if (!data) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  });
  res.end(body);
}

function handleOptions(res) {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  });
  res.end();
}

function createServer(notificationService) {
  const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      handleOptions(res);
      return;
    }

    const requestUrl = new URL(req.url, 'http://localhost');

    if (req.method === 'GET' && requestUrl.pathname === '/api/notifications') {
      const userId = requestUrl.searchParams.get('userId');
      if (!userId) {
        sendJson(res, 400, { error: 'userId is required' });
        return;
      }
      try {
        const notifications = await notificationService.list(userId);
        sendJson(res, 200, { notifications });
      } catch (err) {
        logger.error('Failed to list notifications', { error: err.message });
        sendJson(res, 500, { error: 'Failed to list notifications' });
      }
      return;
    }

    if (req.method === 'POST' && requestUrl.pathname.startsWith('/api/notifications/') && requestUrl.pathname.endsWith('/read')) {
      const segments = requestUrl.pathname.split('/');
      const notificationId = segments[3];
      try {
        const body = (await parseBody(req)) || {};
        const userId = body.userId || requestUrl.searchParams.get('userId');
        if (!userId) {
          sendJson(res, 400, { error: 'userId is required' });
          return;
        }
        const updated = await notificationService.markAsRead(userId, notificationId);
        if (!updated) {
          sendJson(res, 404, { error: 'Notification not found' });
          return;
        }
        sendJson(res, 200, { notification: updated });
      } catch (err) {
        logger.error('Failed to mark notification as read', { error: err.message });
        sendJson(res, 500, { error: 'Failed to mark notification as read' });
      }
      return;
    }

    if (req.method === 'POST' && requestUrl.pathname === '/api/notifications/events') {
      try {
        const body = (await parseBody(req)) || {};
        const type = body.type;
        if (!allowedEventTypes.has(type)) {
          sendJson(res, 400, { error: 'Unsupported event type' });
          return;
        }
        domainEvents.emit(type, body.payload || {});
        sendJson(res, 202, { status: 'accepted' });
      } catch (err) {
        logger.error('Failed to dispatch domain event', { error: err.message });
        sendJson(res, 400, { error: 'Invalid payload' });
      }
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/health') {
      sendJson(res, 200, { status: 'ok' });
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  });

  return server;
}

module.exports = { createServer };
