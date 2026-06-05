# HelmSeek Frontend

SvelteKit frontend for [HelmSeek](https://helmseek.com) — a personalized browser homepage with search, clock, weather widget, quick links, and theme customization.

## Stack

- **SvelteKit 5** with `@sveltejs/adapter-static` (pure SPA, no SSR)
- **Vite** for bundling
- **nginx** for serving in production (inside a Podman container)

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

## Running in Production (Podman)

```bash
./run.sh    # build image, start container, begin log streaming
./stop.sh   # stop container and remove image
```

The container runs on port **3003** via nginx. The `.env` is read at build time — `PUBLIC_API_URL` is baked into the static bundle.

Logs are written to `logs/<timestamp>_CST.log` on the host. A new file is created on each container start.

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
