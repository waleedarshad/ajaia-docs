# AI usage log (kept as I went)

One entry per phase. Written during the work, not reconstructed afterwards.
This is the raw material for `AI_WORKFLOW.md`.

Tools: Claude (planning, scaffolding, code generation, review), run through the Claude desktop app
with access to the project folder. All commits reviewed by me before landing.

## P0: Plan
- Asked for: a scoped plan, stack recommendation, and an architecture decision table before writing code.
- AI produced: PLAN.md with 14 decisions and a phased timeline.
- I changed/rejected: dropped the Python option entirely (one language end to end); kept roles (viewer/editor)
  in scope because it is cheap and shows sharing intent; made Markdown export the only stretch item.
- Verified by: reading the brief against the deliverables checklist line by line.

## P1: Scaffold, Docker, auth
- Asked for: Next.js + Prisma scaffold, Docker Compose, seeded users, signed-cookie session.
- AI produced: schema, session helpers, login page, Dockerfile, compose file, Render blueprint.
- I changed/rejected: avoided bcrypt (native dep that complicates Alpine builds) in favour of Node's built-in
  scrypt; kept the Prisma CLI in the runtime image so migrations run on boot instead of a separate job.
- What went wrong: the first `docker compose up` failed three times, all in the image, not the app. Port 5432 was
  taken on my machine (fixed by not publishing the DB port at all), then the Prisma CLI crashed because `COPY`
  flattened its symlink, then it was missing a transitive dependency. The AI's first fix patched one file at a time;
  I pushed for the root-cause approach: install the pinned CLI properly in its own folder in the image.
- Verified by: the Docker build itself (AI couldn't run Docker; I ran it and pasted the logs back), then signing in
  as Alice on http://localhost:3000.

## P2: Dashboard, create / rename / delete
- Asked for: owned vs shared document lists, create, rename, delete, with server-side validation.
- AI produced: service layer (`server/documents.ts`), API routes, dashboard UI.
- Design calls I kept: role resolution is a pure function (`server/access.ts`) so the sharing rules are unit
  tested without a database; users without access get 404 instead of 403 so document ids can't be probed;
  only owners can delete, editors can rename.
- Verified by: unit tests for the access rules (5 passing), type-check. End-to-end check is a manual run in Docker.
- Limitation worth noting: my sandbox could not download Prisma's engine, so generated Prisma types were not
  available there; type errors that depend on them were verified in the Docker build instead.

## P3: Rich-text editor with autosave
- Asked for: TipTap editor with bold/italic/underline, headings, lists, undo/redo, debounced autosave.
- AI produced: `DocumentEditor` component, a separate `PUT /api/documents/:id/content` endpoint, size/shape validation.
- Design calls I kept: content stored as TipTap JSON (lossless formatting); content saves use their own endpoint so
  a rename never ships the whole body; autosave keeps the latest JSON in a ref and serialises requests (one in
  flight, re-saves if edits arrived meanwhile) so a slow request can't overwrite newer text; failed saves keep the
  changes dirty and show a Retry button; viewers get a read-only editor and the server rejects their writes anyway.
- Rejected: real-time/CRDT collaboration (out of scope); disabling StarterKit's link extension since links weren't
  asked for.
- Verified by: validation unit tests (5 passing), type-check on the component, manual format-and-refresh test.
