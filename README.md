# Ajaia Docs

A lightweight collaborative document editor (Google Docs-inspired) built for the Ajaia
AI-Native Full Stack Developer assignment.

**Stack:** Next.js (App Router) · TypeScript · Prisma · PostgreSQL · Docker Compose

**Live demo:** https://ajaia-docs-nu-blue.vercel.app/ (demo accounts below)

Built phase by phase, one commit per phase. Where to look: `SUBMISSION.md` (what's included and what works),
`docs/ARCHITECTURE.md` (design and decisions), `docs/AI_WORKFLOW.md` (how AI was used), and `docs/PLAN.md`
(the scope plan, written before coding).

## Try the sharing flow

Sign in as Alice, create a document and click **Share**: add `bob@ajaia.test` (Can edit) and `carol@ajaia.test`
(View only). Then sign in as Bob or Carol in a private window. Bob can edit, Carol gets a read-only editor, and
removing Carol's access makes the document disappear for her.

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
- Export any document you can open to **Markdown** (`.md` download) or **PDF** (browser print dialog, "Save as PDF")
- Share a document with another user as **editor** or **viewer**; owned and shared documents are shown separately

### Supported upload types

`.txt`, `.md` (`.markdown`) and `.docx`, up to 4 MB. The file becomes a new document titled after the filename.
Headings, bold/italic/underline, and lists are preserved; images, tables and other unsupported content in a
`.docx` are dropped. Anything outside the editor's schema is stripped on import.

## Deployment

Hosted on **Vercel** (Hobby plan) with a **Neon** Postgres database, both free and without a card.
Docker Compose is the local run path; the `Dockerfile` also builds a production image of the same app.

To deploy your own copy:

1. Create a Neon project and copy the **direct** connection string (connection pooling off, ends in `?sslmode=require`).
2. Apply migrations and seed the demo users once, from your machine:
   ```bash
   npm install
   DATABASE_URL='<neon connection string>' npm run db:setup
   ```
3. Import the repo in Vercel and set the environment variables `DATABASE_URL`, `SESSION_SECRET`
   (any long random string) and `DEMO_PASSWORD` (the shared demo password, e.g. `demo1234`), then deploy.

Vercel has no startup hook, so migrations are a deliberate one-time step rather than running on every boot.
Re-run `npm run db:setup` against Neon whenever the schema changes.

## Tests

`npm test` runs 24 Vitest tests: the sharing and permission rules (against an in-memory fake database), request
validation, and the file importer (including a real `.docx` fixture). There are no browser end-to-end tests.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | Run automated tests |
| `npm run db:setup` | Apply migrations and seed demo users |
