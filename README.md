# BusMedaus Platform API

This repository now includes a modular Express-style API that powers the BusMedaus frontend build. The backend is implemented without external NPM dependencies so it can run in restricted environments while still providing a NestJS/Express-inspired controller → service → repository architecture.

## Features

- **Authentication & Authorization**
  - Registration and login with bcrypt-hashed passwords (delegated to the system Python `crypt` module).
  - JWT access tokens with refresh-token rotation and revocation tracking.
  - Role-based access control for `ADMIN`, `BEEKEEPER`, and `MEMBER` personas.
- **Domain Modules**
  - Users, hives, tasks (with lifecycle management and comment threads), notifications, messaging threads, and media metadata.
  - Each module follows a controller → service → repository layering with validation and transactional safety provided by an in-memory database that supports snapshot-based transactions.
- **Auditing**
  - Middleware records every mutating request, capturing actor, entity metadata, request payload (with sensitive fields redacted), status, and duration.
  - Admin-only endpoint exposes the audit trail for operational oversight.

## Project Structure

```
src/
  common/              Shared middleware and utilities
  config.js            Runtime configuration
  database/            Transaction-aware in-memory persistence
  framework/           Minimal Express-like HTTP framework
  modules/
    auth/              Authentication & refresh token logic
    auditing/          Audit log repository, service, controller
    comments/          Task comment persistence
    hives/             Hive domain logic
    media/             Media metadata management
    messaging/         Messaging threads and messages
    notifications/     User notification lifecycle
    tasks/             Task management and comment integration
    users/             User profile & role management
  main.js              Application bootstrap
```

## Running the API

```
npm start
```

The server listens on `PORT` (default `3000`). Because the implementation is dependency-free, Node.js ≥ 18 is sufficient.

## Authentication Workflow

1. `POST /auth/register` → create an account and receive `{ accessToken, refreshToken }`.
2. Use the access token in the `Authorization: Bearer <token>` header for protected routes.
3. `POST /auth/refresh` exchanges the latest refresh token for fresh credentials (rotation enforced).
4. `POST /auth/logout` invalidates all outstanding refresh tokens for the current user.

## Auditing

Every mutating request automatically logs an entry. Administrators can inspect the history via:

```
GET /admin/audit
Authorization: Bearer <admin access token>
```

Optional query parameters `page` and `limit` support pagination.

## Notes

- The lightweight HTTP framework in `src/framework/express.js` mirrors core Express concepts so existing middleware patterns port cleanly.
- Password hashing uses bcrypt via the host system's Python standard library to avoid external NPM dependencies while maintaining strong security guarantees.
- The in-memory database can be swapped for a persistent layer by implementing repositories against a real datastore; the service layer contracts remain unchanged.
