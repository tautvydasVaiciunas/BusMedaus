# BusMedaus Backend

This repository houses the NestJS backend and the React web console for the BusMedaus platform. The API exposes modules for authentication, hive and task operations, messaging, notifications, media management, and auditing while the Vite-powered front-end consumes those endpoints.

## Setup options

Choose one of the following workflows depending on your environment.

### Option 1: Docker Compose

The Compose configuration under `apps/api/docker-compose.yml` spins up PostgreSQL and the API in coordinated containers.

```bash
docker compose -f apps/api/docker-compose.yml --profile dev up --build
```

The command installs dependencies, builds the monorepo, and starts the NestJS server on <http://localhost:3000>. Run the database tasks in a second terminal once the containers are healthy:

```bash
docker compose -f apps/api/docker-compose.yml exec api npm run db:migrate
docker compose -f apps/api/docker-compose.yml exec api npm run db:seed # optional
docker compose -f apps/api/docker-compose.yml logs -f api # tail the API output
```

Stop the stack with `docker compose -f apps/api/docker-compose.yml --profile dev down`. PostgreSQL data persists in the `postgres-data` volume between runs.

### Option 2: Local environment

Install dependencies and prepare the project directly on your machine. Run the following commands in order (the sequence matches the original quick-start snippet):

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

- `npm install` triggers a `postinstall` hook that fetches the React console dependencies under `apps/web`.
- Database connection details are read from the exported `DB_*` variables in `src/app.module.ts`. Adjust them before running migrations or seeds.
- `npm run build` compiles both the API and front-end bundles.
- `npm run db:migrate` executes the TypeORM migrations under `src/migrations` against the configured database.
- `npm run db:seed` populates development fixtures such as the default users, hives, and tasks.
- `node dist/main.js` launches the compiled NestJS server on <http://localhost:3000>.

## Running the applications

### Backend API

After migrations complete, start the API with one of:

- `node dist/main.js` for the compiled build (as shown above).
- `docker compose -f apps/api/docker-compose.yml --profile dev up --build` when using containers.

The service exposes CORS for the origin provided by `WEB_ORIGIN`. Supply a comma-separated list (for example, `http://localhost:5173,https://admin.example.com`) to allow multiple clients.

### Front-end console

The React console lives in `apps/web` and uses Vite in development.

```bash
npm run dev:web
```

Export `VITE_API_BASE_URL=http://localhost:3000` (or create `apps/web/.env.local`) so the UI proxies requests to your local API instance. Additional front-end commands:

```bash
npm run lint:web
npm run test:web
```

`npm run build` already compiles the front-end and outputs optimised assets to `dist/web` for the backend to serve later.

## Notifications configuration

Optional notification transports rely on the following environment variables:

| Variable | Purpose |
| --- | --- |
| `SENDGRID_API_KEY` | API key for SendGrid requests. |
| `SENDGRID_FROM_EMAIL` | Verified sender used for outbound messages. |
| `FIREBASE_PROJECT_ID` | Firebase project identifier for FCM. |
| `FIREBASE_CLIENT_EMAIL` | Service account client email for FCM. |
| `FIREBASE_PRIVATE_KEY` | Service account private key (escape newlines as `\n`). |

Client devices register push tokens with `POST /notifications/subscriptions` and can revoke them via `DELETE /notifications/subscriptions/:id`. The service records delivery metadata for in-app, email, and push channels.

## Demo credentials

Use the seeded accounts after running `npm run db:seed`:

| Role | Email | Password |
| --- | --- | --- |
| Administrator | admin@busmedaus.test | ChangeMe123! |
| Field Operator | liam@busmedaus.test | ChangeMe123! |

Reset the passwords immediately in production environments.

Further examples of browser push configuration live in [`docs/browser-push.md`](docs/browser-push.md).
