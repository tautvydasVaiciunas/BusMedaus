# BusMedaus Notifications

This repository now includes a lightweight notification platform for the BusMedaus beekeeping management system. The service delivers transactional notifications triggered by domain events (task assignment, overdue alerts, hive inspection notes) through multiple channels:

- **Email** using [SendGrid](https://sendgrid.com/)
- **Push notifications** using [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- **In-app delivery** exposed through a REST API and real-time WebSocket updates

A background worker backed by an in-memory queue processes notification jobs so that API requests remain fast and resilient. Secrets are managed centrally via environment variables or an optional encrypted `server/config/secrets.json` file that is ignored by Git.

## Project structure

```
/
├── README.md                         # This guide
├── .env.example                      # Environment variable template
├── asset-manifest.json               # Static bundle manifest (updated with notification script)
├── index.html                        # Injects the notification front-end helper script
├── static/js/notifications-service.js# Front-end service layer for notifications
└── server/                           # Notification microservice (Node.js)
    ├── config/
    │   ├── providers.example.json    # Maps logical providers to secret keys
    │   └── secrets.example.json      # Example secrets store (never commit real values)
    ├── data/                         # Runtime storage (ignored via .gitignore)
    ├── src/
    │   ├── app.js                   # HTTP API routing & domain event endpoint
    │   ├── config.js                # Environment/config loader
    │   ├── domainEvents.js          # Global domain event emitter
    │   ├── eventHandlers/           # Domain -> notification handlers
    │   ├── notifications/           # Queue, repository, worker, and service logic
    │   ├── providers/               # SendGrid & Firebase integrations (HTTP based)
    │   ├── secrets/                 # Secrets manager abstraction
    │   └── websocket/               # Minimal WebSocket gateway implementation
    ├── test/                        # Node test suite (node --test)
    └── package.json                 # Scripts (start/test)
```

## Getting started

1. **Install Node.js 18+** (uses the built-in `fetch` API and `node:test`).
2. **Copy the environment templates** and fill in secrets:

   ```bash
   cp .env.example .env
   cp server/config/secrets.example.json server/config/secrets.json
   cp server/config/providers.example.json server/config/providers.json
   ```

   Populate the following secrets via `.env` or `server/config/secrets.json`:

   - `SENDGRID_API_KEY` / `SENDGRID_FROM_EMAIL`
   - `FIREBASE_PROJECT_ID` (or set inside `providers.json`)
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_WEB_PUSH_KEY`

3. **Run the service**:

   ```bash
   cd server
   npm start
   ```

   The API listens on `PORT` (default `4000`).

4. **Trigger notifications** by emitting domain events:

   ```bash
   curl -X POST http://localhost:4000/api/notifications/events \
     -H "Content-Type: application/json" \
     -d '{
       "type": "task.assigned",
       "payload": {
         "task": { "id": "task-1", "title": "Inspect hive #7", "dueDate": "2024-05-01" },
         "assignee": {
           "id": "user-123",
           "email": "beekeeper@example.com",
           "pushTokens": ["demo-device-token"],
           "name": "Jonas"
         }
       }
     }'
   ```

5. **Front-end integration** uses the globally exposed `window.notificationsService` helper (see `static/js/notifications-service.js`). Example:

   ```javascript
   const client = window.notificationsService.connect('user-123');
   client.subscribe((message) => {
     if (message.type === 'notification_created') {
       console.log('Received notification', message.payload);
     }
   });

   window.notificationsService.fetchNotifications('user-123');
   ```

## API reference

### `GET /api/notifications?userId=<id>`
Returns the notification inbox for the user.

### `POST /api/notifications/:notificationId/read`
Marks a notification as read. Provide `{ "userId": "..." }` in the JSON body (or query string).

### `POST /api/notifications/events`
Accepts a domain event payload (one of `task.assigned`, `task.overdue`, `hive.inspection.note`) and enqueues downstream deliveries. The handler fan-outs to email, push, and in-app channels via the worker queue.

### WebSocket `/api/notifications/ws?userId=<id>`
Provides real-time updates. Messages follow the structure `{ type: 'notification_created' | 'notification_read', payload: {...} }`. Clients may also send `{ type: 'markRead', notificationId }` or `{ type: 'ping' }` frames.

## Secrets and configuration management

- The `SecretManager` reads environment variables first, then falls back to `server/config/secrets.json` (ignored by Git). Refresh the cache with `SecretManager.refresh()` after rotating secrets.
- Provider metadata lives in `server/config/providers.json`. Each provider maps logical properties to secret names so that rotating credentials only requires editing one file.
- Runtime settings (port, queue concurrency, storage file) are defined via environment variables—see `.env.example` for details.

## Testing

Run the automated test suite (uses built-in `node:test`):

```bash
cd server
npm test
```

The tests cover the repository, queue behaviour, and the notification service pipeline (with stubbed transport providers).

## Infrastructure notes

- **Queue/background worker**: `NotificationQueue` coordinates asynchronous jobs; `NotificationWorker` handles delivery off the main request thread.
- **SendGrid** integration is implemented via the official REST API using the `SENDGRID_API_KEY` secret. Fallback logging prevents crashes when credentials are missing.
- **Firebase Cloud Messaging** uses the legacy HTTP endpoint with the `FIREBASE_WEB_PUSH_KEY` server key for simplicity. Replace with the OAuth-based HTTP v1 flow if stricter security is required.
- Add the service to your infrastructure by deploying the `server` directory as a standalone Node.js service (container, systemd, etc.) and exposing port `4000` (or your configured port).

## Future enhancements

- Swap the in-memory queue with Redis/RabbitMQ for horizontal scalability.
- Persist user devices/emails centrally to avoid duplicating metadata inside events.
- Expand WebSocket authentication/authorization to use JWTs instead of bare `userId` query parameters.
- Add retry/backoff logic for failed provider calls.
