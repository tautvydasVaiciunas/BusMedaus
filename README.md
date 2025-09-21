# BusMedaus Backend

This repository contains a NestJS backend that powers the BusMedaus platform. It provides modules for authentication, user management, hive collaboration, task workflows, messaging, notifications, media management, and audit logging.

## Getting started

```bash
npm install
npm run build
npm start
```

The service listens on `http://localhost:3000` and persists data to a local SQLite database stored under `data/app.sqlite`.

## Web console

A modern React + Vite front-end lives under `apps/web`. It mirrors the existing UI screenshots in `static/photos` and is
powered by Tailwind CSS, ESLint/Prettier, and Vitest with React Testing Library. Until the backend API is available, the
screens rely on deterministic mock services so developers can iterate on layout and interactions.

Useful commands:

```bash
# Launch the front-end in development mode
npm run dev:web

# Run the web lint rules or tests
npm run lint:web
npm run test:web
```

`npm run build` now compiles the React console before producing the backend bundle, writing optimised assets to
`dist/web`. The NestJS server can later serve these files once the integration layer is prepared.

## Key features

- **Authentication** with bcrypt hashed passwords, short-lived JWT access tokens, and rotating refresh tokens.
- **Role-based access control** enforced through guards that honour `admin`, `manager`, and `member` roles.
- **Modular domain APIs** for users, hives, tasks, notifications, messaging, and media with layered controllers, services, and repositories.
- **Transactional workflows** ensuring hive, task, messaging, and media operations commit atomically.
- **Auditing middleware** that records every state-changing request and exposes the logs through secure admin endpoints.

All endpoints apply request validation and respond with sanitized payloads that omit sensitive fields.

## Notifications configuration

Email and push notifications are now sent through SendGrid and Firebase Cloud Messaging when credentials are present. Configure the transports through environment variables:

| Variable | Purpose |
| --- | --- |
| `SENDGRID_API_KEY` | API key for SendGrid requests. |
| `SENDGRID_FROM_EMAIL` | Verified sender used for outbound messages. |
| `FIREBASE_PROJECT_ID` | Firebase project identifier for FCM. |
| `FIREBASE_CLIENT_EMAIL` | Service account client email for FCM. |
| `FIREBASE_PRIVATE_KEY` | Service account private key (literal `\n` escapes are converted to newlines). |

Client devices register push tokens by calling `POST /notifications/subscriptions`, and tokens can be revoked with `DELETE /notifications/subscriptions/:id`. Each domain module now passes channel hints so that the `NotificationsService` fans out in-app, email, and push payloads while recording delivery status metadata on the notification records.
