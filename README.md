# BusMedaus Backend

This repository contains a NestJS backend that powers the BusMedaus platform. It provides modules for authentication, user management, hive collaboration, task workflows, messaging, notifications, media management, and audit logging.

## Getting started

```bash
npm install
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export DB_NAME=busmedaus
npm run build
npm run db:migrate
npm run db:seed # optional
node dist/main.js
```

The backend requires access to PostgreSQL. Connection details are read from the `DB_*` environment variables in `src/app.module.ts`.
By default the service expects a database named `busmedaus` available on `localhost:5432` with the `postgres` user. Adjust the
variables above to match your environment before running the migrations or starting the API. Once running, the server listens on
`http://localhost:3000`.

### Database migrations and seed data

Run pending migrations with `npm run db:migrate`. This command executes the TypeORM migrations registered under `src/migrations`
against the database configured by `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_NAME`.

Populate development fixtures by running `npm run db:seed` after the migrations complete. The seed script uses the same connection
settings to insert baseline users, hives, and tasks that help during local testing.

### Docker Compose workflow

For a fully containerised setup, use the Compose file under `apps/api/docker-compose.yml`:

```bash
docker compose -f apps/api/docker-compose.yml --profile dev up --build
```

This spins up a PostgreSQL 16 instance alongside the API service. The API container installs dependencies, builds the project,
runs database migrations, and launches the NestJS server connected to the `postgres` service. Stop the stack with
`docker compose -f apps/api/docker-compose.yml --profile dev down`. The PostgreSQL data persists in the `postgres-data` named
volume between runs.

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
