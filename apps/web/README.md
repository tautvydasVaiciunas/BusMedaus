# BusMedaus Web Console

This package contains the Vite + React (TypeScript) front-end that mirrors the legacy screenshots in `../../static/photos`.
It uses Tailwind CSS for styling primitives, ESLint + Prettier for formatting, and Vitest with React Testing Library for UI
contracts. The app mounts React Query hooks backed by the shared `apiClient`, so every console view calls the live NestJS API
routes (such as `/tasks`, `/hives`, and `/users`) instead of deterministic mocks.

## Available scripts

```bash
npm install           # install dependencies
npm run dev           # start Vite in development mode
npm run build         # type-check and produce the production bundle
npm run lint          # run ESLint using the flat config
npm run test          # execute Vitest + React Testing Library
npm run preview       # serve the production build locally
```

The production build writes hashed assets to `../../dist/web`. When the NestJS backend is ready to serve static files it can
point to that directory and expose `index.html` as the entry point.

## Configuring the API target

Vite reads the backend base URL from the `VITE_API_BASE_URL` environment variable. Set it to the running NestJS instance (for
example, `http://localhost:3000`) before starting the dev server or building the bundle:

```bash
VITE_API_BASE_URL=http://localhost:3000 npm run dev
```

You can also create an `.env.local` file alongside this README with the same variable so `npm run dev` and `npm run build` use
the correct API automatically. When configured, the console renders the real task, hive, and notification data managed by the
backend.
