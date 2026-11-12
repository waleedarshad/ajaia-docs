# AI workflow note

## Tools
- **Claude** (via the Claude desktop app, working directly in the project folder with file and shell access) for planning,
  scaffolding, implementation, tests and docs.
- **Me:** I set scope, approved each phase before the next started, ran the Docker build on my machine and fed the logs
  back, created the Neon and Vercel accounts and entered all secrets myself, and read every diff before it was committed.
  The raw, per-phase record is in `docs/AI_LOG.md`; commits are one per phase.

## How I used it
Phase by phase, not one big prompt: plan and scope first (`docs/PLAN.md`, written before any code), then scaffold and Docker,
dashboard, editor, sharing, import, deploy, docs. Each phase ended with something I could run and check before moving on.
I asked for the reasoning behind each choice so the architecture note would be mine to defend, not just generated.

## Where AI materially sped me up
- Scaffolding the Next.js/Prisma/Docker setup and the repetitive route, validation and error-handling code.
- The TipTap editor and the file-import pipeline (docx, markdown and text into the editor's JSON format).
- Writing the tests quickly, including a fake in-memory database so the real permission rules could be tested.
- Drafting the documentation from the decision log and AI log kept during the build.

## What I changed, rejected or caught
- **Rejected scope:** real-time collaboration (CRDT), a separate Express backend, and letting Neon's agent prompt rewrite the app's
  database driver. I wrote a narrower prompt instead; for this app a plain connection string was all that was needed.
- **Docker image fixes:** the first container build failed three times (port clash, Prisma CLI flattened by `COPY`, a
  missing dependency). The AI's first fix patched one file at a time; I pushed for the root cause: install the pinned CLI
  properly in its own folder.
- **Deployment pivot:** Render asked for a credit card, contradicting its own docs. I tested it for real rather than trusting
  either source, and moved to Vercel + Neon, adjusting the upload limit (5 MB to 4 MB) and the migration step.
- **Found by tests:** error types were dragging the database client into every import (`http.ts` imported from `session.ts`); I moved the class.
  One of my own tests was wrong (Set vs array matcher).
- **Found by running it:** the one-time Neon setup script crashed on a clean checkout because it never generated the Prisma
  client; I fixed the script so the README steps work from scratch.
- **Kept deliberately:** 404 for strangers vs 403 for collaborators without permission; owner-only sharing and deleting;
  the editor schema doubling as the import sanitiser.

## How I verified correctness, UX and reliability
- **Automated:** 24 Vitest tests covering the permission rules end to end (grant, change role, revoke, what each role can do),
  request validation, and the importer on a real `.docx` fixture.
- **Run for real:** Docker Compose on my machine (login as a seeded user), migrations applied to the Neon database, and the
  Vercel deployment.
- **Manual walkthrough:** create, format, refresh, rename, upload `.md` and `.docx`, then the two-user sharing flow
  (editor can edit, viewer is read-only, revoked user gets "not found"); shown in the walkthrough video.
- **Honest limits:** the AI could not run Docker or download Prisma's engine in its sandbox, so I was the runtime for the
  container build and the database. There are no browser-level end-to-end tests.
