# LifeScore Build Plan

## 1. Project Scaffolding
- Init monorepo (`/client`, `/server`, `/shared`)
- Vite + React + TypeScript for client
- Express + TypeScript for server
- Shared types package
- ESLint, Prettier, tsconfig

## 2. Database
- Provision PostgreSQL
- Write migrations: `users`, `categories`, `daily_entries`, `scores`
- Unique constraint on `(user_id, date)`
- Seed default categories on user creation

## 3. Backend — Auth
- `POST /api/auth/register` (hash password, return JWT)
- `POST /api/auth/login`
- JWT middleware for protected routes

## 4. Backend — Core API
- Categories CRUD (`GET/POST/PUT/DELETE /api/categories`)
- Entries CRUD (`GET/POST/PUT/DELETE /api/entries`)
- Scores saved with entry (batch insert)

## 5. Backend — Analytics
- `GET /api/analytics/overall` — daily/weekly/monthly averages, streak, best/worst category
- `GET /api/analytics/category/:id` — avg, min, max, stddev per category
- Heatmap data endpoint

## 6. Frontend — Foundation
- Tailwind + shadcn/ui setup
- Zustand store (auth token, theme)
- React Query client
- Sidebar layout + routing (React Router)
- Dark mode toggle

## 7. Frontend — Auth Pages
- Register page
- Login page
- Protected route wrapper

## 8. Frontend — Dashboard
- Today's score card
- Weekly/monthly average cards
- Streak card
- Best/worst category cards

## 9. Frontend — Daily Entry Page
- Score sliders (1–10) per category
- Notes textarea
- One entry per day (edit if exists)

## 10. Frontend — History Page
- Calendar view
- List view
- Filters: date range, category, min score

## 11. Frontend — Analytics Page
- Overall score trend line chart
- Per-category trend charts (dynamic, one per category)
- Multi-series comparison chart (select categories)
- Radar chart (selected day snapshot)
- GitHub-style heatmap calendar

## 12. Frontend — Goals Page
- Create/edit/delete goals (`category >= threshold`)
- Progress display on dashboard

## 13. Frontend — Settings Page
- Custom category management (add/edit/delete)
- Profile/account settings

## 14. Polish
- Mobile responsive layout
- Loading/error states
- Empty states
- Form validation

## 15. Deploy
- Containerize (Docker)
- Deploy DB + server + client
