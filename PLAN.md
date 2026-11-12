# Ajaia Assignment: Build Plan (Collaborative Doc Editor)

Status: DRAFT for approval. Nothing is built yet. Time budget: ~230 min from plan approval.

## 1. Product slice (what "good" looks like)
A lightweight Google-Docs-style editor, "Ajaia Docs", for a small team.

**Must ship (core, in priority order)**
1. Seeded login (3 users) -> documents dashboard with "Owned by me" / "Shared with me" sections
2. Create, rename, edit, auto-save, reopen document
3. Rich text: bold, italic, underline, H1/H2/H3, bullet + numbered lists
4. File upload: .txt / .md / .docx -> new editable document (supported types stated in UI + README)
5. Sharing: owner grants another user access (editor or viewer); shared docs visibly badged; viewers are read-only
6. Persistence: Postgres; content stored as TipTap JSON so formatting survives refresh
7. Validation + error handling, 1+ meaningful automated tests (sharing/access logic)
8. Docker Compose local run + live deployment + README + architecture note + AI note + SUBMISSION.md

**Stretch (only if >30 min spare):** Export to Markdown. Nothing else.

**Deliberately cut (and say so in the video):** real-time multi-cursor collaboration, comments, version history, real auth/password reset, org/group sharing, PDF export, mobile polish.

## 2. Architecture decisions (each with rationale)

| # | Decision | Choice | Why | Tradeoff |
|---|---|---|---|---|
| D1 | Language | **Node / TypeScript** end to end | Best rich-text ecosystem (TipTap), one language across UI/API/tests, fast to deploy, typed contracts | One language means a smaller pool of ready-made backend libs than a polyglot setup, but far less context switching in a timebox |
| D2 | App framework | **Next.js (App Router) + API route handlers** | One deployable unit, no CORS, server-side access checks next to UI | Less "classic" backend separation; mitigated by keeping logic in `src/server/` services, not in route files |
| D3 | Editor | **TipTap** (ProseMirror) with StarterKit + Underline | Gives all required formatting out of the box, JSON doc model, stable | Bundle size; irrelevant here |
| D4 | Storage | **PostgreSQL** via Docker Compose locally, free hosted Postgres in prod (Neon) | Matches "docker compose + ready-made" plan; durable in prod, unlike SQLite on free ephemeral hosts | Slightly more setup than SQLite |
| D5 | ORM | **Prisma** | Fast schema + migrations + typed queries, well known by reviewers | Heavier than raw SQL |
| D6 | Content format | **TipTap JSON** stored as `jsonb` | Lossless round trip of formatting; easy server-side validation | Needs conversion for export/import (done in upload step) |
| D7 | Auth | **Mocked-but-real session**: 3 seeded users, login page with demo password, signed httpOnly cookie | Satisfies "simulate users" while still enforcing access on the server | Not production auth; stated clearly |
| D8 | Sharing model | `Document.ownerId` + `DocumentShare(documentId, userId, role: EDITOR|VIEWER)` | Minimal, clear, testable. Role is cheap and shows intent | No groups/links |
| D9 | Access enforcement | Single `getDocumentAccess(userId, docId)` function used by every route | One place to test, no scattered checks | |
| D10 | Upload | `.txt`, `.md`, `.docx` -> new doc. `mammoth` (docx->HTML) and `marked` (md->HTML), then HTML -> TipTap JSON. 4 MB limit (Vercel request-body cap), type allowlist | Product-relevant import flow; limited, honest scope | Complex docx (tables, images) is dropped; documented |
| D11 | Saving | Debounced autosave (~1s) + "Saved/Saving..." indicator | Feels like a real editor; simple PUT | Last write wins (no merge); documented |
| D12 | Testing | **Vitest**: access-control unit tests + import conversion test; optional one API test | Highest-value logic gets tested | No e2e browser tests (cut for time) |
| D13 | Deploy | **Vercel** (Hobby) + **Neon** Postgres (free) | Free, no card, native Next.js hosting, no cold-start wait for reviewers. *Changed from Render during the build: Render asks for a card to deploy a web service.* | Migrations/seed become a one-time manual step (no boot hook); uploads capped at 4 MB by Vercel's request-body limit |
| D14 | Repo layout | Single repo, `docker-compose.yml` (app + postgres), `.env.example`, `docs/` | Easy review | |

## 3. Data model
- `User(id, email, name, passwordHash)` seeded: alice@, bob@, carol@ (demo password in README)
- `Document(id, title, content jsonb, ownerId, createdAt, updatedAt)`
- `DocumentShare(id, documentId, userId, role)` unique(documentId, userId)

## 4. API surface
- `POST /api/login`, `POST /api/logout`, `GET /api/me`
- `GET /api/documents` -> `{ owned: [], shared: [] }`
- `POST /api/documents` (create) | `GET/PATCH/DELETE /api/documents/:id` (rename + content)
- `POST /api/documents/:id/share` `{ email, role }` | `DELETE .../share/:userId`
- `POST /api/documents/import` (multipart upload)

## 5. Execution phases (approval-gated, collaborative)
Each phase ends with: what changed, how it works, how to verify. You approve before the next.

| Phase | Time | Output | Verify |
|---|---|---|---|
| P0 Scope + plan (now) | 15 | This file, repo initialised | You approve scope/stack |
| P1 Scaffold + Docker | 25 | Next.js, Prisma schema, compose (app + db), seed users | `docker compose up` shows login page |
| P2 Auth + dashboard | 25 | Login, owned/shared lists, create/rename | Create doc, refresh, still there |
| P3 Editor + autosave | 40 | TipTap toolbar, autosave, reopen | Format text, refresh, formatting persists |
| P4 Sharing + access logic | 35 | Share modal, roles, badges, read-only viewer, tests | Alice shares to Bob; Bob sees it; viewer can't edit |
| P5 Upload/import | 25 | .txt/.md/.docx -> new doc, UI messaging, tests | Upload sample files |
| P6 Deploy | 25 | Live URL on Vercel + Neon | Reviewer flow works on live URL |
| P7 Docs + video | 35 | README, ARCHITECTURE.md, AI_WORKFLOW.md, SUBMISSION.md, screenshots, video | Checklist below |
| Buffer | 10 | | |

**Cut rule:** if P4 is not done by minute ~150, drop viewer-vs-editor roles (keep single "can edit" share) and skip Markdown export. If P6 is at risk, deploy early (after P2) with an empty app, then redeploy as features land.

## 6. Deliverables checklist (from the brief)
- [ ] Source code
- [ ] README.md (local setup, run, test, seeded users, supported upload types)
- [ ] Architecture note (docs/ARCHITECTURE.md)
- [ ] AI workflow note (docs/AI_WORKFLOW.md): tools used, where AI sped me up, what I changed/rejected, how I verified
- [ ] SUBMISSION.md (exact list of what's included + what's working/incomplete/next 2-4h)
- [ ] Live URL + test credentials
- [ ] walkthrough-video.txt (Loom/YouTube unlisted link)
- [ ] Screenshots / GIF
- [ ] One Google Drive folder with all of the above

## 7. AI-native workflow (what to show, honestly)
- Use AI for scaffolding, boilerplate, test drafts, and README drafts.
- Keep a running `docs/AI_LOG.md` as we go: 1 line per phase: prompt goal, what AI produced, what I changed or rejected, how I verified.
- Candidates for "changed/rejected" evidence (real ones will be recorded as they happen): tightening access checks, rejecting over-built features, fixing docx import edge cases.
- Verification: run tests, manual two-user sharing walkthrough, check refresh persistence, check unauthorized access returns 403/404.

## 8. Reviewer message (send when you start, ~2 min)
> Hi team, I've started the assignment. My approach: Next.js + TypeScript, TipTap editor, Postgres via Docker Compose, deployed on Vercel/Neon free tiers. I'm prioritising end-to-end core flows (create/edit/save, import from .txt/.md/.docx, owner-to-user sharing with roles) over breadth, and I'm using AI tooling for scaffolding and tests while reviewing and verifying each step myself. I'll document my scope cuts, AI usage, and verification in the submission. — Waleed

## 9. Video outline (3 min)
0:00 Goal + scope (20s) | 0:20 Login as Alice, create/format/rename doc, refresh (45s) | 1:05 Upload .md/.docx -> editable doc (30s) | 1:35 Share to Bob, switch user, show shared badge + read-only/editable (45s) | 2:20 Architecture + cuts (30s) | 2:50 How AI helped + what I'd do next (20s)

## 10. Risks
- Neon scales to zero when idle, so the first request after a quiet period can be a little slower -> open the live URL before recording the video.
- docx import fidelity -> limited scope, documented.
- Docker not tested in my sandbox (I have no Docker here) -> you run `docker compose up` on your Mac at each phase; that is also your verification step.
