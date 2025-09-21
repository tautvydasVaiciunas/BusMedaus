(function (global) {
  const DEFAULT_HEADERS = {
    Accept: 'application/json'
  };

  function resolveBase(baseUrl) {
    if (baseUrl) {
      return baseUrl;
    }
    if (global.NOTIFICATION_API_BASE_URL) {
      return global.NOTIFICATION_API_BASE_URL;
    }
    return global.location.origin;
  }

  async function fetchNotifications(userId, options) {
    const baseUrl = resolveBase(options && options.baseUrl);
    const url = new URL('/api/notifications', baseUrl);
    url.searchParams.set('userId', userId);
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: DEFAULT_HEADERS
    });
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    const data = await response.json();
    return data.notifications || [];
  }

  async function markAsRead(userId, notificationId, options) {
    const baseUrl = resolveBase(options && options.baseUrl);
    const url = new URL(`/api/notifications/${notificationId}/read`, baseUrl);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });
    if (!response.ok) {
      throw new Error('Failed to update notification');
    }
    const data = await response.json();
    return data.notification;
  }

  function buildWebSocketUrl(userId, options) {
    const baseUrl = resolveBase(options && options.baseUrl);
    const url = new URL('/api/notifications/ws', baseUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.searchParams.set('userId', userId);
    return url.toString();
  }

  function connect(userId, options = {}) {
    const url = buildWebSocketUrl(userId, options);
    const socket = new WebSocket(url);
    const listeners = new Set();

    socket.addEventListener('message', (event) => {
      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch (err) {
        payload = { type: 'raw', payload: event.data };
      }
      listeners.forEach((listener) => {
        try {
          listener(payload);
        } catch (error) {
          console.error('notificationsService listener error', error);
        }
      });
    });

    if (options.onOpen) {
      socket.addEventListener('open', options.onOpen);
    }
    if (options.onClose) {
      socket.addEventListener('close', options.onClose);
    }
    if (options.onError) {
      socket.addEventListener('error', options.onError);
    }

    return {
      socket,
      subscribe(handler) {
        listeners.add(handler);
        return () => listeners.delete(handler);
      },
      markAsRead(notificationId) {
        socket.send(
          JSON.stringify({
            type: 'markRead',
            notificationId
          })
        );
      },
      ping() {
        socket.send(JSON.stringify({ type: 'ping' }));
      },
      close() {
        socket.close();
      }
    };
  }

  global.notificationsService = {
    fetchNotifications,
    markAsRead,
    connect
  };
})(window);
