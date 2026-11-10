# HelmSeek Frontend

SvelteKit frontend for [HelmSeek](https://helmseek.com) — a personalized browser homepage with search, clock, weather widget, quick links, and theme customization.

## Stack

- **Preact** + **@preact/signals** for UI and state (about 23 KB of JS, gzipped)
- **TypeScript** and **Vite**, with CSS Modules for component styles
- A pure static SPA, with no server rendering
- **nginx** for serving in production (inside a Docker container)

## Requirements

- Node.js 22+
- A running [HelmSeek backend](../helmseek-backend)

## Environment Variables

Create a `.env` file in the project root:

```env
PUBLIC_API_URL=https://api.yourdomain.com
```

This URL is embedded into the JS bundle at build time by Vite. It must point to the backend API.

## Running Locally

```bash
npm install
npm run dev
```

App runs on `http://localhost:5173` by default.

## Running in Production (Docker)

```bash
docker compose up -d --build   # build image and start container
docker compose down            # stop and remove the container
```

The container runs on port **3003** via nginx. The `.env` is read at build time — `PUBLIC_API_URL` is baked into the static bundle.

Logs are kept by Docker's `local` driver (10 files of 10 MB, oldest dropped first). View them with `docker logs -f helmseek-frontend`. They survive restarts but are deleted with the container, so `docker compose down` or a recreate on `up --build` starts a fresh log.

## Features

- **Search** — configurable default search engine
- **Clock & greeting** — time-aware greeting message
- **Weather widget** — Open-Meteo integration, configurable position, cached locally
- **Quick links** — up to 8 custom bookmarks, URL-validated (http/https only)
- **Theme** — light/dark mode, multiple color schemes
- **Config sync** — authenticated users can sync settings across devices via the backend

## Project layout

```
src/
  main.tsx, App.tsx     entry point and page composition
  components/           one component per widget or modal (styles in *.module.css)
    settings/           the settings modal, split into one component per section
  hooks/                shared behavior (theme, session bootstrap, sync status, ...)
  lib/
    api/                backend and weather API calls
    state/              signals: config, auth, toasts, settings modal
    types/, utils/      shared types and pure helpers
  app.css               global styles shared across components
```

## Testing

```bash
npm test             # unit and component tests (Vitest + Testing Library)
npm run test:watch   # re-run those on change
npm run test:e2e     # end-to-end tests in a real browser (Playwright)
npm run check        # type-check
```

Tests sit next to the code they cover (`*.test.ts`, `*.test.tsx`). They cover the pure logic
(calculator, weather and time helpers), the state and API layers, and the flows where a
regression would hurt: sign-in, quick links, settings visibility, the widgets, and session expiry.
The API is always mocked, so no backend or account is needed.

The end-to-end tests (`e2e/`) build the app, serve it, and drive it in Google Chrome. A small
in-memory fake backend (`e2e/fixtures.ts`) answers the API calls, and fonts, icons, weather and
Google are stubbed, so the tests are repeatable and work offline. They use your installed Chrome;
in CI, `npx playwright install --with-deps chrome` provides it. If a test fails, open the trace with
`npx playwright show-trace test-results/<test>/trace.zip`.

## Building

```bash
npm run build
```

Output is in `build/`. Served as static files — no Node.js process at runtime.
