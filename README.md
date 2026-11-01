# HelmSeek Frontend

SvelteKit frontend for [HelmSeek](https://helmseek.com) — a personalized browser homepage with search, clock, weather widget, quick links, and theme customization.

## Stack

- **SvelteKit 5** with `@sveltejs/adapter-static` (pure SPA, no SSR)
- **Vite** for bundling
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
- **Weather widget** — OpenWeatherMap integration, configurable position, cached locally
- **Quick links** — up to 8 custom bookmarks, URL-validated (http/https only)
- **Theme** — light/dark mode, multiple color schemes
- **Config sync** — authenticated users can sync settings across devices via the backend

## Building

```bash
npm run build
```

Output is in `build/`. Served as static files — no Node.js process at runtime.
