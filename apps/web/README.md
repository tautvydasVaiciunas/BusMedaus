# BusMedaus Web Console

This package contains the Vite + React (TypeScript) front-end that mirrors the legacy screenshots in `../../static/photos`.
It uses Tailwind CSS for styling primitives, ESLint + Prettier for formatting, and Vitest with React Testing Library for UI
contracts. Until the production API is live the screens fetch data from deterministic mock services so that the component
structure matches the expected backend payloads.

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
