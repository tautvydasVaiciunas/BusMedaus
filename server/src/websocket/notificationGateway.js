const crypto = require('crypto');
const url = require('url');
const { logger } = require('../config');

function createFrame(data, opcode = 0x1) {
  const payload = Buffer.from(data);
  let header;
  const length = payload.length;
  if (length < 126) {
    header = Buffer.alloc(2);
    header[1] = length;
  } else if (length < 65536) {
    header = Buffer.alloc(4);
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }
  header[0] = 0x80 | opcode;
  return Buffer.concat([header, payload]);
}

function createPongFrame(payload) {
  return createFrame(payload, 0x0a);
}

function acceptKey(key) {
  return crypto
    .createHash('sha1')
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`, 'binary')
    .digest('base64');
}

class NotificationGateway {
  constructor(server, notificationService) {
    this.server = server;
    this.notificationService = notificationService;
    this.connections = new Map();
    this.server.on('upgrade', (req, socket, head) => this.handleUpgrade(req, socket, head));
  }

  handleUpgrade(req, socket) {
    const { pathname, query } = url.parse(req.url, true);
    if (pathname !== '/api/notifications/ws') {
      socket.destroy();
      return;
    }
    const userId = query.userId;
    if (!userId) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }
    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }
    const accept = acceptKey(key);
    const headers = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${accept}`
    ];
    socket.write(`${headers.join('\r\n')}\r\n\r\n`);

    socket.userId = userId;
    socket.setTimeout(0);
    socket.setNoDelay(true);

    socket.on('data', (data) => this.handleSocketData(socket, data));
    socket.on('close', () => this.removeConnection(userId, socket));
    socket.on('error', (err) => {
      logger.warn('WebSocket error', { error: err.message });
      this.removeConnection(userId, socket);
    });

    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId).add(socket);

    this.send(socket, JSON.stringify({ type: 'connected' }));
  }

  removeConnection(userId, socket) {
    if (this.connections.has(userId)) {
      const set = this.connections.get(userId);
      set.delete(socket);
      if (set.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  handleSocketData(socket, buffer) {
    if (!buffer || buffer.length < 2) {
      return;
    }
    let offset = 2;
    const firstByte = buffer[0];
    const opcode = firstByte & 0x0f;
    const masked = (buffer[1] & 0x80) === 0x80;
    let payloadLength = buffer[1] & 0x7f;

    if (payloadLength === 126) {
      payloadLength = buffer.readUInt16BE(offset);
      offset += 2;
    } else if (payloadLength === 127) {
      payloadLength = Number(buffer.readBigUInt64BE(offset));
      offset += 8;
    }

    let maskingKey;
    if (masked) {
      maskingKey = buffer.slice(offset, offset + 4);
      offset += 4;
    }

    let payload = buffer.slice(offset, offset + payloadLength);
    if (masked && maskingKey) {
      payload = payload.map((byte, index) => byte ^ maskingKey[index % 4]);
    }

    if (opcode === 0x8) {
      socket.end();
    } else if (opcode === 0x9) {
      socket.write(createPongFrame(payload));
    } else if (opcode === 0x1) {
      try {
        const message = JSON.parse(payload.toString('utf8'));
        if (message.type === 'ping') {
          this.send(socket, JSON.stringify({ type: 'pong', ts: Date.now() }));
        }
        if (message.type === 'markRead' && message.notificationId) {
          this.notificationService
            .markAsRead(socket.userId, message.notificationId)
            .catch((err) => logger.error('Failed to mark notification from socket', { error: err.message }));
        }
      } catch (err) {
        logger.warn('Failed to parse WebSocket message', { error: err.message });
      }
    }
  }

  send(socket, message) {
    try {
      socket.write(createFrame(message));
    } catch (err) {
      logger.warn('Failed to push message over WebSocket', { error: err.message });
    }
  }

  broadcast(userId, data) {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    const sockets = this.connections.get(userId);
    if (!sockets) {
      return;
    }
    for (const socket of sockets) {
      this.send(socket, payload);
    }
  }
}

module.exports = { NotificationGateway };
