# HelmSeek Frontend

The web app for [HelmSeek](https://helmseek.com), a personalized browser homepage: a search box,
a greeting or clock, weather, quick links and a quote of the day, all themeable.

It is a static single-page app built with Preact and TypeScript. It talks to the
[HelmSeek backend](https://github.com/ShivankKapoor/helmseek-backend) for accounts and for syncing
settings across devices, and works without an account too, keeping settings in the browser.

## Features

- **Search**: a Google search box. Start with `=` to use it as a calculator (`=2+3*4` shows
  `= 14`); Enter copies the answer. Searching for nothing nudges you instead.
- **Greeting and clock**: a time-of-day greeting, a digital clock, both, or neither; 12 or 24 hour,
  optional seconds, and an optional name.
- **Weather**: looked up by ZIP code through Open-Meteo, shown in a screen corner of your choice.
  The reading is reused for 30 minutes before it is refreshed.
- **Quick links**: up to 10 labelled links (labels up to 20 characters), placed in three screen
  corners. The fourth corner is always taken by the settings button.
- **Quote of the day** (signed in only): shown under the search box, and can be hidden for the day.
- **Appearance**: light or dark mode, 8 color schemes and 8 fonts.
- **Right-click menu** for quick access to settings. Shift + right-click still opens the browser's own menu.
- **Accounts**: sign in to keep your settings on the server and use them on any device. Accounts are
  created in the backend's auth service, so the sign-in form has no registration.

## Getting started

You need Node.js 22 or newer and a running copy of the backend.

```bash
npm install
cp .env.example .env     # then point PUBLIC_API_URL at your backend
npm run dev              # http://localhost:3003
```

The backend must allow this origin. Add `http://localhost:3003` to `ALLOWED_ORIGIN` in the backend's
`.env`. Its session cookie is `SameSite=Strict`, so the app and the API have to be on the same
site (for example `helmseek.com` and `api.helmseek.com`, or both on `localhost`).

### Configuration

| Variable | Example | Meaning |
|---|---|---|
| `PUBLIC_API_URL` | `http://localhost:7666` | Base URL of the backend API |

`PUBLIC_API_URL` is written into the JavaScript bundle when the app is **built**, so changing it
means rebuilding. If it is empty, the app calls its own origin, which is what the browser tests use.
If it is missing entirely, the build still succeeds but every API call goes to the wrong place, so
make sure it is set wherever the production image is built.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check, then build the static site into `build/` |
| `npm run preview` | Serve the built site locally |
| `npm run check` | Type-check only |
| `npm test` | Unit and component tests (Vitest and Testing Library) |
| `npm run test:watch` | Re-run those tests when files change |
| `npm run test:e2e` | End-to-end tests in a real browser (Playwright) |
| `npm run test:nginx` | Build the Docker image and check what nginx actually sends |

## How it works

**Settings live in two places.** Every change is saved to the browser's `localStorage` straight
away, so the app works signed out and the page starts with your settings. When you are signed in, the
same change is also sent to the backend. On load the app asks the backend for your config and, if you
have a session, replaces the local copy with it. Signing out returns to the defaults.

**The app never handles your session token.** Signing in posts your username and password to the
backend, which sets an `HttpOnly` cookie. The browser attaches it to later requests. If any request
comes back `401`, the app signs you out and, if you had been signed in, shows a "session expired"
message. A visitor who was never signed in keeps their local settings.

**Weather is fetched by the browser, not the backend.** The browser asks Open-Meteo for the weather
and sends the result to the backend, which stores it on your account. That keeps the free weather API
from being called on every page load from every device.

**Colors and dark mode are applied before the first render; the font is not.** This avoids a flash
of the light theme. The saved font is applied just after the first render on purpose. Painting the
first frame in a fallback font makes the text change size when the web font loads, and browsers then
report that later repaint as the Largest Contentful Paint, which measurably slowed it down.

### Backend API used

| Method and path | Used for |
|---|---|
| `POST /auth/login`, `POST /auth/logout` | Signing in and out |
| `GET /user/config`, `POST /user/config` | Loading and saving settings (quick links travel as a JSON string) |
| `POST /user/weather` | Storing the latest weather reading |
| `GET /quote`, `POST /quote/hideQuote`, `POST /quote/unhideQuote` | The quote of the day |

The backend validates what it receives. For example, it rejects quick-link URLs that are not
`http` or `https`. The settings form only shows a hint, so links you add while signed out are not
checked until they are synced.

## Project layout

```
src/
  main.tsx, App.tsx       Entry point and page composition
  components/             One component per widget or modal, each with its *.module.css
    settings/             The settings modal, split into one component per section
  hooks/                  Shared behavior: theme, session start-up, clock, sync status, Escape key
  lib/
    api/                  Calls to the backend and to Open-Meteo
    state/                Signals for config, auth, toasts and the settings modal
    theme/                Applying colors, dark mode and the font to the page
    types/, utils/        Shared types and small pure helpers (calculator, weather, time, ...)
  app.css                 Global styles shared across components
  test/                   Test setup and helpers
e2e/                      Playwright tests and the fake backend they use
scripts/verify-nginx.sh   Checks the production image's headers, caching and redirects
public/                   Static files copied as-is: favicon, manifest, robots.txt, sitemap
```

Conventions: state is held in `@preact/signals`; component styles are CSS Modules; `@/` is an alias
for `src/`; test files sit next to the code they cover.

## Testing

```bash
npm test               # logic, state, API layer, and the key user flows
npm run test:e2e       # the whole app in Chrome, against a fake backend
npm run test:nginx     # the production image served by nginx (needs Docker)
```

- **Unit and component tests** (`*.test.ts`, `*.test.tsx`) mock the API, so no backend or account
  is needed. They cover the calculator and helpers, the state and API layers, and flows such as
  sign-in, quick links, settings and session expiry.
- **End-to-end tests** (`e2e/`) build the app, serve it and drive it in your installed Google Chrome.
  A small in-memory fake backend answers the API calls, and fonts, icons, weather and Google are
  stubbed, so the tests are repeatable and work offline. In CI, `npx playwright install --with-deps chrome`
  provides Chrome. To inspect a failure, run `npx playwright show-trace test-results/<test>/trace.zip`.
- **The nginx check** builds the Docker image and verifies that the security headers are sent on every
  response, how assets are cached, that unknown paths redirect cleanly, and that config and source
  files cannot be downloaded.

GitHub Actions (`.github/workflows/test.yml`) runs the type check, the unit tests, the build, the
nginx check and the end-to-end tests on every push and pull request to `master`.

## Production

The site is built into static files and served by nginx inside a Docker container.

```bash
docker compose up -d --build   # build the image and start the container
docker compose down            # stop and remove the container
```

- The container listens on port **3003**.
- The build reads `.env`, so it must exist on the machine that builds the image.
- Logs use Docker's `local` driver (10 files of 10 MB, oldest dropped first). View them with
  `docker logs -f helmseek-frontend`. They survive restarts but are deleted with the container.
- To be able to roll back, tag the running image first: `docker tag helmseek-frontend helmseek-frontend:previous`.

What nginx does (`nginx.conf` and `security-headers.conf`):

- `index.html` is never cached, so a deploy takes effect on the next visit. Hashed JS, CSS and
  images are cached for a year.
- It sends `X-Content-Type-Options`, `X-Frame-Options` and `Referrer-Policy` on every response.
  Each location includes `security-headers.conf` explicitly, because nginx drops server-level
  headers from any location that sets a header of its own.
- Unknown paths redirect to `/` with a relative `Location`, so neither the internal port nor the
  request's `Host` header can leak into the redirect.
