# BusMedaus API

TypeScript + Prisma backend for the BusMedaus platform. The initial schema models users, roles, hives, inspections, tasks, notifications, harvest logs, media attachments, and audit events based on the ERD captured in [`../docs/erd.md`](../docs/erd.md).

## Project Structure

```
apps/api
├── package.json
├── prisma
│   ├── migrations
│   │   └── 20240921120000_init
│   │       └── migration.sql
│   ├── schema.prisma
│   └── seed.ts
├── src
│   └── index.ts
├── tsconfig.json
└── .env.example
```

## Prerequisites

- Node.js 18+
- npm 9+
- Docker & Docker Compose (for local/CI Postgres)

> **Note:** The automated evaluation environment used to author this repository blocks outbound network access, so dependency installation (`npm install`) was not executed here. Run the commands below locally to install packages before running migrations or seeds.

## Environment Variables

Copy the template and update values as needed:

```bash
cp .env.example .env
```

| Variable      | Description                                                              |
| ------------- | ------------------------------------------------------------------------ |
| `DATABASE_URL`| PostgreSQL connection string used by Prisma.                             |
| `API_PORT`    | Port that the (future) HTTP server will listen on.                       |
| `NODE_ENV`    | Node environment flag (`development`, `test`, `production`).             |

## Installing Dependencies

```bash
npm install
```

## Database Tasks

The repository includes manual Prisma migration SQL compatible with PostgreSQL 16.

| Task                          | Command                            |
| ----------------------------- | ---------------------------------- |
| Generate Prisma client        | `npm run prisma:generate`          |
| Apply migrations locally      | `npm run prisma:migrate:dev`       |
| Apply migrations in CI/prod   | `npm run prisma:migrate`           |
| Run database seeds            | `npm run db:seed`                  |

When running seeds for the first time, ensure a fresh database to avoid constraint conflicts. The seed script uses `upsert` patterns so it is idempotent for development workflows.

## Docker Compose Profiles

A `docker-compose.yml` file is provided at the repository root to standardise local and CI environments.

### Local Development

```bash
# start Postgres + API watcher
docker compose --profile dev up --build
```

This starts:

- `postgres` – PostgreSQL 16 with persistent `postgres-data` volume.
- `api` – Node 20 container that installs dependencies, runs migrations, seeds the database, and starts the `npm run dev` watcher (currently a placeholder message until the HTTP layer is implemented).

### Continuous Integration Example

In CI you can reuse the same Compose file without the `api` profile and run commands manually:

```bash
# Start only Postgres
docker compose up -d postgres

# Wait for database readiness (compose healthcheck handles this)

# Install dependencies and run migrations/seeds
npm install
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
```

Remember to tear down the services at the end of the pipeline:

```bash
docker compose down -v
```

## Next Steps

- Implement the HTTP/GraphQL layer for the BusMedaus API.
- Add automated tests and linting.
- Extend schema to incorporate stakeholder feedback (seasonal inspection variants, notification delivery medium history, and richer audit metadata).
