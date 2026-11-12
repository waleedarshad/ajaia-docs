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
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db   # just Postgres, on host port 5433 (set DB_PORT to change)
cp .env.example .env
npm install
npm run db:setup                 # apply migrations + seed users
npm run dev
```

## Features

- Create, rename, edit, delete documents; autosave; rich text (bold, italic, underline, H1-H3, bullet and numbered lists)
- Upload a file to turn it into a new editable document
- Share a document with another user as **editor** or **viewer**; owned and shared documents are shown separately

### Supported upload types

`.txt`, `.md` (`.markdown`) and `.docx`, up to 5 MB. The file becomes a new document titled after the filename.
Headings, bold/italic/underline, and lists are preserved; images, tables and other unsupported content in a
`.docx` are dropped. Anything outside the editor's schema is stripped on import.

## Deployment

Deployed as a Docker web service on Render (free tier) with a Neon (free) Postgres database.
`render.yaml` describes the service; set `DATABASE_URL` to Neon's direct connection string
(`...?sslmode=require`) in the Render dashboard. Migrations and demo-user seeding run on every boot.

Note: Render's free tier spins the service down after 15 minutes without traffic, so the first request
after a quiet period can take up to a minute while it wakes up.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | Run automated tests |
| `npm run db:setup` | Apply migrations and seed demo users |
