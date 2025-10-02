# BusMedaus Backend

This repository contains a NestJS backend that powers the BusMedaus platform. It provides modules for authentication, user management, hive collaboration, task workflows, messaging, notifications, media management, and audit logging.

## Getting started

Follow one of the workflows below to launch the API and supporting services.

### Option A: Docker Compose

Use the Compose definition in `apps/api/docker-compose.yml` to provision PostgreSQL and the API service together:

```bash
docker compose -f apps/api/docker-compose.yml --profile dev up --build
```

The stack installs dependencies, builds the project, runs migrations and seeds, and then starts the NestJS server connected to the bundled PostgreSQL 16 container. Stop the services when you are done:

```bash
docker compose -f apps/api/docker-compose.yml --profile dev down
```

### Option B: Local PostgreSQL + Node.js

Prepare a PostgreSQL database reachable from your workstation (for example, a local instance on `localhost:5432` with a `postgres` user and `busmedaus` database). Then run the following commands in order:

```bash
npm install
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export DB_NAME=busmedaus
export WEB_ORIGIN=http://localhost:5173
npm run build
npm run db:migrate
npm run db:seed # optional
node dist/main.js
```

> **PowerShell tip:** replace the `export` lines above with `$env:DB_HOST = "localhost"`, `$env:DB_PORT = "5432"`, and so on.

The initial `npm install` command triggers a `postinstall` hook that also installs the React console dependencies under `apps/web`, ensuring `npm run build` bundles both the backend and front-end assets. Once the environment variables match your database, running the API starts the server on `http://localhost:3000`.

### CORS configuration

The backend enables Cross-Origin Resource Sharing (CORS) for browser-based clients. Set the `WEB_ORIGIN` environment variable to
a comma-separated list of allowed origins (for example,
`https://app.example.com,https://admin.example.com`). If the variable is not set, the API allows requests from
`http://localhost:5173` to match the Vite development server used by the web console. Remember to restart the API after changing
this value so NestJS picks up the updated configuration.

### Database migrations and seed data

Run pending migrations with `npm run db:migrate`. This command executes the TypeORM migrations registered under `src/migrations`
against the database configured by `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_NAME`.

Populate development fixtures by running `npm run db:seed` after the migrations complete. The seed script uses the same connection
settings to insert baseline users, hives, and tasks that help during local testing.

Use `npm run db:reset` to drop the existing schema and rebuild it from scratch. The script clears all tables with TypeORM's
`clearDatabase` helper before chaining the migration and seed routines so you can recover a clean environment quickly.

### Docker Compose workflow

The Compose profile described in [Option A](#option-a-docker-compose) provisions PostgreSQL 16 and the API service in one stack. It installs dependencies, builds the project, runs migrations and seeds, and then launches the NestJS server connected to the `postgres` service. PostgreSQL data persists in the `postgres-data` named volume between runs.

## Web console

A modern React + Vite front-end lives under `apps/web`. It mirrors the existing UI screenshots in `static/photos` and is
powered by Tailwind CSS, ESLint/Prettier, and Vitest with React Testing Library. The console now uses React Query and the
shared `apiClient` to call the live NestJS API routes (for example, `/tasks`, `/hives`, `/users`, and `/notifications`) so
you see real data while iterating on the UI.

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

### Front-end environment configuration

The Vite dev server expects an API URL at build time. Set the `VITE_API_BASE_URL` environment variable (for example,
`http://localhost:3000`) before running `npm run dev:web` so the console proxies requests to your backend. You can place the
value in `apps/web/.env.local`, export it in your shell session, or inject it through your process manager. When the setting
is in place, the UI surfaces the same task, hive, and messaging data served by the NestJS instance.

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
| `FIREBASE_PRIVATE_KEY` | Service account private key (literal `\n` escapes with a single backslash are converted to newlines). |

Client devices register push tokens by calling `POST /notifications/subscriptions`, and tokens can be revoked with `DELETE /notifications/subscriptions/:id`. Each domain module now passes channel hints so that the `NotificationsService` fans out in-app, email, and push payloads while recording delivery status metadata on the notification records.

Front-end integracijos pavyzdžiai bei naršyklės konfigūracijos žingsniai aprašyti faile [`docs/browser-push.md`](docs/browser-push.md).

## Demo credentials

| Role  | Email                  | Password   |
| ----- | ---------------------- | ---------- |
| Admin | `admin@busmedaus.test` | `Admin123!`|
| User  | `user@busmedaus.test`  | `User123!` |
