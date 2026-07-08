# Quran — Quran Companion

A modern, feature-rich Quran reading and listening web application built with **Angular 21**, **Tailwind CSS v4**, and **Vitest**.

## Features

- **Full Mushaf Reader** — Uthmani script with word-by-word highlighting
- **Audio Recitations** — 15+ curated reciters with per-ayah playback
- **Search** — Full-text Quran search with Arabic & translation support
- **Bookmarks** — Tagged, organized bookmarks synced to your account
- **Reading Progress** — Auto-saves last read position per surah
- **Khatm Planner** — Set a goal to complete the Quran in a date range
- **Habit Tracker** — Track daily verses read with streaks
- **Tafsir & Translation** — Inline commentary and multi-language translation
- **3 Themes** — Light, Ivory (warm), and Dark (night mode)
- **RTL Support** — Full Arabic right-to-left layout with ngx-translate
- **Google Auth** — Sign in with Google (optional)

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Angular 21 (standalone, no NgModules) |
| Styling | Tailwind CSS v4 + PostCSS |
| Testing | Vitest 4 + @angular/build:unit-test |
| i18n | @ngx-translate/core (ar / en) |
| HTTP | Angular HttpClient with functional interceptors |
| Backend | .NET Web API (separate repo) |

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (default: http://localhost:4200)
npm start

# Run tests
npm test

# Production build (outputs to ../backend/Quran.Api/wwwroot)
npm run build
```

## Project Structure

```
src/
├── app/
│   ├── core/                  # Singleton services, guards, interceptors, models
│   │   ├── guards/            # Auth guard
│   │   ├── interceptors/      # Loading, auth, error interceptors
│   │   ├── models/            # API response interfaces
│   │   └── services/          # ApiService, AuthService, ToastService, etc.
│   ├── features/              # Lazy-loaded feature pages
│   │   ├── auth/              # Login & Register
│   │   ├── bookmarks/         # User bookmarks with tags
│   │   ├── home/              # Landing page (surah list, last-read, stats)
│   │   ├── mushaf/            # Uthmani script reader
│   │   ├── profile/           # User profile & settings
│   │   ├── reader/            # Audio player & surah detail
│   │   ├── reciters/          # Reciter list & detail pages
│   │   └── search/            # Full-text search
│   └── shared/                # Reusable components
│       └── components/        # Header, Footer, AudioPlayer, Toast, etc.
├── assets/
│   ├── fonts/                 # KFGQPC Uthmani, Scheherazade, etc.
│   ├── i18n/                  # Translation JSON files (ar, en)
│   └── imgs/                  # Static images
└── environments/              # API base URL config
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Dev server with HMR |
| `npm run build` | Production build |
| `npm test` | Run Vitest unit tests |

## Environment

API base URL is configured in `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5205/api',
};
```

## Testing

The project uses Vitest with Angular's test harness. Tests are co-located with source files as `*.spec.ts`.

```bash
npm test
```

## Backend

This frontend expects a .NET Web API at the configured `apiBaseUrl`. The production build is configured to output directly to `../backend/Quran.Api/wwwroot` for seamless deployment.
