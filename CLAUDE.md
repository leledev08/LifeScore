# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**LifeScore** — personal performance tracking app. Users rate life categories (1–10) daily and track trends over time. See `PROJECT_SPEC.md` for full feature spec.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand (client), React Query (server) |
| Charts | Recharts |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | JWT |

## Expected Project Structure

```
/
├── client/          # Vite + React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/       # Dashboard, DailyEntry, History, Analytics, Goals, Settings
│   │   ├── store/       # Zustand stores
│   │   └── api/         # React Query hooks
├── server/          # Express backend
│   ├── routes/
│   ├── middleware/  # JWT auth middleware
│   └── db/          # PostgreSQL queries/migrations
└── shared/          # Shared TypeScript types
```

## Commands

```bash
# Install deps
npm install

# Run DB migrations (requires DATABASE_URL in server/.env)
npm run migrate

# Dev (client + server concurrently)
npm run dev

# Frontend only / backend only
npm run dev:client
npm run dev:server

# Build all
npm run build
```

## Deploy (Docker)

```bash
cp .env.example .env          # set DB_PASSWORD and JWT_SECRET
docker compose up --build -d  # starts db, migrate, server, client
# client → http://localhost
# server → http://localhost:3001
```

The `migrate` service runs once on startup and exits. Migrations are idempotent (tracked in `migrations` table).

## Database Schema

Four tables: `users`, `categories`, `daily_entries`, `scores`. `categories` are per-user (supports custom categories). `scores` links `entry_id` + `category_id` + score value. One entry per user per day enforced at DB level.

## API Shape

Base prefix `/api`. Auth routes at `/api/auth/register` and `/api/auth/login`. All other routes require Bearer JWT. Analytics at `/api/analytics` (overall) and `/api/analytics/category/:id`.

## Key Architectural Decisions

- **Custom categories**: default categories seeded per user on registration; users can add/edit/delete their own. Analytics pages must dynamically render charts for all of a user's categories.
- **One entry per day**: enforce unique constraint on `(user_id, date)` in `daily_entries`.
- **Stats computed server-side**: the `/api/analytics` endpoints return pre-aggregated stats (avg, min, max, stddev) — don't compute these in the frontend.
- **Dark mode**: required by spec; use Tailwind `dark:` variants and a theme toggle stored in Zustand.
