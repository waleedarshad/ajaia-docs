# Submission: Ajaia Docs (collaborative document editor)

**Live product:** https://ajaia-docs-nu-blue.vercel.app/
**Walkthrough video:** see `walkthrough-video.txt`
**Source:** this folder (also on GitHub: https://github.com/waleedarshad/ajaia-docs)

## Test accounts (all use password `demo1234`)

| User | Email |
|---|---|
| Alice | alice@ajaia.test |
| Bob | bob@ajaia.test |
| Carol | carol@ajaia.test |

To see sharing: sign in as Alice, create a document, click **Share**, add `bob@ajaia.test` (Can edit) and
`carol@ajaia.test` (View only), then sign in as Bob or Carol in a private window.

## What is included

| Path | What it is |
|---|---|
| `src/`, `prisma/`, `package.json`, `Dockerfile`, `docker-compose.yml` | Source code, schema and migrations, Docker setup |
| `README.md` | Local setup and run instructions, supported upload types, deployment notes |
| `docs/ARCHITECTURE.md` | Architecture note: design, access model, decision log, limitations, next steps |
| `docs/AI_WORKFLOW.md` | AI workflow note (tools, where AI helped, what I changed or rejected, verification) |
| `docs/AI_LOG.md` | Raw per-phase AI usage log kept during the build |
| `docs/PLAN.md` | Scope and plan written before coding |
| `SUBMISSION.md` | This file |
| `walkthrough-video.txt` | Link to the 3 to 5 minute walkthrough video |
| `screenshots/` | Screenshots of the main flows |

## What works

- Sign in as a seeded user; dashboard with **Owned by me** and **Shared with me**
- Create, rename (from the dashboard or document header), edit, delete (owner only); autosave and reopen
- Rich text: bold, italic, underline, headings H1 to H3, bulleted and numbered lists, undo and redo
- Upload `.txt`, `.md` or `.docx` (up to 4 MB) to create a new editable document; clear errors for unsupported files
- Share with another user by email as **Can edit** or **View only**; change or remove access; viewers get a read-only editor
- Data persists in Postgres (Neon); formatting is preserved as the editor's JSON
- 24 automated tests; validation and consistent error handling on every API route

## Intentionally not built (and why)

Real-time collaboration, comments, version history, real authentication, PDF export, tables and images in imports.
Prioritised depth in editing, sharing and import over breadth; reasons are in `docs/ARCHITECTURE.md`.

## Known limitations

- Last write wins if two people edit the same document at once (no merge or presence).
- Demo-grade authentication (shared demo password).
- `.docx` import drops images and tables.
- Browser end-to-end tests were not written; the UI was verified manually.
- Neon scales to zero when idle, so the first request after a quiet period can be slightly slower.

## What I would build next (with another 2 to 4 hours)

Playwright tests for the two-user flow, optimistic-concurrency conflict warnings with presence indicators,
Markdown export then version history, real auth with invite links, and migrations in CI.

## Run locally

```bash
docker compose up --build      # then open http://localhost:3000
npm test                       # unit tests (after npm install)
```
Full instructions and the deployment steps are in `README.md`.
