# BusMedaus Backend

This repository contains a NestJS backend that powers the BusMedaus platform. It provides modules for authentication, user management, hive collaboration, task workflows, messaging, notifications, media management, and audit logging.

## Greitas startas lokaliai

```bash
npm ci --ignore-scripts
npm --prefix apps/web ci --legacy-peer-deps
npm run build
npm run dev
```

Pirmoji komanda įdiegia Node priklausomybes, antroji sutvarko front-end modulį, o `npm run build` užtikrina, kad galutiniai paketai būtų paruošti prieš paleidžiant bendrą `npm run dev` darbo eigą.

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
# install backend dependencies
npm ci --ignore-scripts

# install the front-end workspace
npm --prefix apps/web ci --legacy-peer-deps

# configure the API to talk to your PostgreSQL instance (example values below)
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export DB_NAME=busmedaus
export JWT_SECRET=dev-secret
export REFRESH_SECRET=dev-refresh-secret
export WEB_ORIGIN=http://localhost:5173

# nukreipti Vite užklausas į vietinį API
export VITE_API_BASE_URL=http://localhost:3000

# paruošti schemą ir duomenų sėklas
npm run db:migrate
npm run db:seed

# start the API and React console together
npm run dev
```

On Windows, replace the `export` statements with the equivalents for your shell:

- **PowerShell**

  ```powershell
  $env:DB_HOST = "localhost"
  $env:DB_PORT = "5432"
  $env:DB_USERNAME = "postgres"
  $env:DB_PASSWORD = "postgres"
  $env:DB_NAME = "busmedaus"
  $env:JWT_SECRET = "dev-secret"
  $env:REFRESH_SECRET = "dev-refresh-secret"
  $env:WEB_ORIGIN = "http://localhost:5173"
  $env:VITE_API_BASE_URL = "http://localhost:3000"
  ```

- **Command Prompt**

  ```bat
  set DB_HOST=localhost
  set DB_PORT=5432
  set DB_USERNAME=postgres
  set DB_PASSWORD=postgres
  set DB_NAME=busmedaus
  set JWT_SECRET=dev-secret
  set REFRESH_SECRET=dev-refresh-secret
  set WEB_ORIGIN=http://localhost:5173
  set VITE_API_BASE_URL=http://localhost:3000
  ```

`npm run db:migrate` pritaiko schemos pakeitimus, `npm run db:seed` įkelia demonstracinius įrašus, o `npm run dev` paleidžia NestJS API (kartu su migracijomis ir sėklomis) bei Vite web konsolę vienu procesu.

### Aplinkos kintamieji

**Backend**

- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `REFRESH_SECRET`
- `WEB_ORIGIN`

**Frontend**

- `VITE_API_BASE_URL`

### API sveikatos patikra

Patikrinkite, ar serveris veikia, išsiųsdami užklausą:

```
GET http://localhost:3000/health -> { status: 'ok' }
```

### CORS configuration

The backend enables Cross-Origin Resource Sharing (CORS) for browser-based clients. Set the `WEB_ORIGIN` environment variable to
a comma-separated list of allowed origins (for example,
`https://app.example.com,https://admin.example.com`). If the variable is not set, the API allows requests from
`http://localhost:5173` to match the Vite development server used by the web console. Remember to restart the API after changing
this value so NestJS picks up the updated configuration.

## Deployment to Neon, Render, and Vercel

### Provision a Neon database

1. Create a new project in the [Neon](https://console.neon.tech) dashboard and add a branch for production.
2. Open the **Connection Details** panel and copy the pooled PostgreSQL connection string (for example,
   `postgres://<user>:<password>@<host>/<database>?sslmode=require`).
3. Store this value as `DATABASE_URL` in your deployment environments (Render and Vercel) so both the API and build steps can
   reach the managed PostgreSQL instance.
4. Rotate the password or regenerate the connection string in Neon if the credentials are ever exposed, and update the
   corresponding `DATABASE_URL` values immediately.

### Deploy the API to Render

1. Create a **Web Service** in Render that points to this repository and select the branch you want to deploy.
2. Set the **Build Command** to:

   ```bash
   npm ci --ignore-scripts && npm --prefix apps/web ci --legacy-peer-deps && npm run build
   ```

3. Set the **Start Command** to:

   ```bash
   node dist/main.js
   ```

4. Configure the following environment variables under the **Environment** section:

   - `DATABASE_URL` → the Neon connection string from above.
   - `JWT_SECRET` → production JWT signing secret.
   - `REFRESH_SECRET` → production refresh token secret.
   - `WEB_ORIGIN` → comma-separated list of allowed browser origins.

5. Trigger a deploy. Once Render finishes building, check `https://<render-service>.onrender.com/health` to verify the API is
   reachable and returning `{ status: 'ok' }`.

### Deploy the front-end to Vercel

1. Import the repository into Vercel and set the **Root Directory** to `apps/web`.
2. Use `npm run build` as the **Build Command** and `dist` as the **Output Directory**.
3. Add the `VITE_API_BASE_URL` environment variable pointing to the public Render API URL (for example,
   `https://<render-service>.onrender.com`).
4. After Vercel assigns the production URL, add it to the Render `WEB_ORIGIN` environment variable so the API accepts browser
   requests from the deployed front-end.
5. Redeploy the Render service to apply the updated CORS configuration, then test the Vercel site in the browser. The front-end
   should report a healthy connection when the `/health` endpoint responds with `{ status: 'ok' }`.

### Database migrations and seed data

Run pending migrations with `npm run db:migrate`. This command executes the TypeORM migrations registered under `src/migrations`
against the database configured by `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_NAME`.

Populate development fixtures by running `npm run db:seed` after the migrations complete. The seed script uses the same connection
settings to insert baseline users, hives, and tasks that help during local testing.

Use `npm run db:migrate` and `npm run db:seed` together whenever you need to refresh the schema and repopulate the seed data.

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
`apps/web/dist`. The NestJS server can later serve these files once the integration layer is prepared.

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
