# Ajaia Docs

A lightweight collaborative document editor (Google Docs-inspired) built for the Ajaia
AI-Native Full Stack Developer assignment.

**Stack:** Next.js (App Router) · TypeScript · Prisma · PostgreSQL · Docker Compose

> Status: work in progress, built phase by phase. See `PLAN.md` for scope and `docs/` for notes.

## Run locally (Docker)

Requires Docker Desktop.

```bash
docker compose up --build
```

Open http://localhost:3000. Migrations and demo-user seeding run automatically on startup.

### Demo accounts

All use the password `demo1234`.

| User  | Email             |
|-------|-------------------|
| Alice | alice@ajaia.test  |
| Bob   | bob@ajaia.test    |
| Carol | carol@ajaia.test  |

## Run locally (without Docker for the app)

```bash
docker compose up -d db          # just Postgres
cp .env.example .env
npm install
npm run db:setup                 # apply migrations + seed users
npm run dev
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | Run automated tests |
| `npm run db:setup` | Apply migrations and seed demo users |
