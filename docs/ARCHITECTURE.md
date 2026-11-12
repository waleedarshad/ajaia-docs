# Architecture note

Ajaia Docs is a small collaborative document editor: create, rich-text edit, upload, and share documents between users.
This note explains what I built, what I deliberately did not, and why. The decision log in section 9 is the short version.

## 1. Goals and non-goals

**Goals (in priority order):** a coherent end-to-end slice rather than broad shallow coverage: documents that persist
with their formatting, a real access model enforced on the server, a useful import flow, and something reviewers can
actually open and test.

**Non-goals (cut on purpose):** real-time multi-user editing (cursors, CRDTs), comments anchored to text selections or
suggestion mode, version history, real authentication (sign-up, password reset, SSO), groups or link sharing, mobile polish.
Two small extras were added late and are deliberately simple: export (Markdown file, PDF through the browser print
dialog) and a flat comment thread per document.
Each of these is a project on its own; the brief asked for depth in a few areas over shallow coverage of many.

## 2. System overview

```
 Browser (React client components: editor, share dialog, dashboard actions)
    |  fetch JSON / multipart            server-rendered pages (cookie session)
    v
 Next.js route handlers  (src/app/api/**/route.ts)   <- thin: parse, validate, call a service, map errors
    |
    v
 Service layer (src/server/*.ts)                      <- all business rules live here
   access.ts       pure role resolution + permission checks (no I/O)
   documents.ts    list / get / create / rename / save / delete
   sharing.ts      grant, change, revoke, list shares (owner only)
   importer.ts     .txt / .md / .docx  ->  TipTap JSON
   session.ts      signed-cookie session        validation.ts  zod schemas        http.ts  error types
    |
    v
 Prisma  ->  PostgreSQL (Neon in production, Postgres container locally)
```

One deployable Next.js app on Node.js. The "backend" is the route handlers plus the `src/server` service layer, so I get
a conventional layered backend without paying for a second service, CORS, duplicated types and a second deploy.
Route files contain no business rules; they call services, which is what makes the rules unit-testable.

## 3. Data model

| Table | Purpose | Notes |
|---|---|---|
| `User` | seeded demo users | email unique; password stored as salted scrypt hash |
| `Document` | title + content + owner | `content` is `jsonb` holding TipTap/ProseMirror JSON |
| `DocumentShare` | (document, user, role) | role `EDITOR` or `VIEWER`; unique per (document, user); cascades on delete |
| `Comment` | (document, author, body) | flat thread per document, not tied to a text selection; cascades on delete |

Storing the editor's native JSON (not HTML) means formatting round-trips losslessly and the server can validate its
shape. Migrations are plain SQL under `prisma/migrations`.

## 4. Access control

Every route resolves the caller's role through one pure function, `resolveRole(doc, userId)`, and then asks a
permission helper:

| Action | Owner | Editor | Viewer | No access |
|---|---|---|---|---|
| Open / read | yes | yes | yes | 404 |
| Edit content, rename | yes | yes | no (403) | 404 |
| Share / change / revoke | yes | no (403) | no (403) | 404 |
| Delete | yes | no (403) | no (403) | 404 |

Comments follow the same rules: anyone who can open a document (including a viewer) can read and post; a comment can be
deleted by its author or by the document owner. A comment id is always checked against the document in the URL, so a
comment can't be deleted through another document.

Design choices: people with no access get **404, not 403**, so document ids can't be probed; people who can see a
document but lack permission get an explicit **403**; the UI hides controls a user can't use, but the server is the
source of truth and rejects the request regardless. Sharing is an upsert, so choosing a different role simply updates it.

## 5. Editor and autosave

TipTap (ProseMirror) with StarterKit: bold, italic, underline, H1 to H3, bullet and numbered lists, undo/redo.
The editor and the importer import the same extension list (`src/lib/editorExtensions.ts`), so there is a single
document schema.

Autosave is debounced (1 s) and deliberately conservative: at most **one save in flight**; if more edits arrive
meanwhile, it saves again afterwards, so a slow earlier request can never overwrite newer text. The latest JSON lives
in a ref, so a save still works when the user navigates away right after typing. A failed save keeps the changes marked
dirty and shows a Retry button; `beforeunload` warns when something is unsaved. Content saves use their own endpoint
(`PUT /api/documents/:id/content`, 1 MB cap) so a rename never ships the whole body.

## 6. File import

Supported: `.txt`, `.md`/`.markdown`, `.docx`, up to **4 MB** (Vercel's request-body cap is about 4.5 MB). The file becomes a
new document titled after the filename. All formats go through one path: convert to HTML (mammoth for docx, marked for
markdown, paragraph splitting for text), then parse that HTML **against the editor schema**. This gives valid output by
construction and doubles as the sanitiser: scripts, unknown tags and attributes, and images are dropped, not trusted.
Images and tables in `.docx` are not imported (stated in the UI and README). Files are rejected with specific errors
for wrong type, empty, too large, not a real zip, or no readable text.

## 7. Authentication

Mocked-but-real: three seeded users, a login form, and an HMAC-signed, `httpOnly`, `SameSite=Lax` session cookie (7 days)
that the server verifies on every request. Passwords use Node's built-in scrypt (no native dependency to break the
Docker build). This is enough to enforce access properly for the exercise; it is not a replacement for an auth provider.

## 8. Validation, errors, testing

- zod validates every request body (title 1 to 120 chars, share email and role, document envelope and size).
- One error type (`HttpError`) and one handler (`handleApiError`) give consistent JSON errors and status codes.
- **41 automated tests** (Vitest). The most valuable ones run the *real* sharing and permission code against an in-memory
  fake database: grant, change role, revoke, what each role may do, strangers get 404. Others cover validation and a
  real `.docx` fixture through the importer (headings, bold/italic/underline, lists).
- Not covered: browser-level end-to-end tests (cut for time); the UI was verified manually.

## 9. Decision log

| # | Decision | Alternatives considered | Why this | Tradeoff accepted |
|---|---|---|---|---|
| 1 | Node/TypeScript end to end | Python backend + JS editor | One language, typed contracts, best rich-text ecosystem | Smaller backend library choice |
| 2 | Next.js app with route handlers | Separate Express API + React SPA | One deploy, no CORS, shared types | Less "classic" separation (mitigated by the service layer) |
| 3 | TipTap editor | Quill, Slate, contenteditable | Needed formatting out of the box, JSON model | Larger bundle |
| 4 | Postgres + Prisma | SQLite, Supabase | Durable in hosted envs; matches Docker Compose plan; typed queries | More setup than SQLite |
| 5 | Content as TipTap JSON | HTML or Markdown | Lossless, validatable | Needs conversion for import/export |
| 6 | Seeded users + signed cookie | NextAuth, a real provider | Real server-side enforcement in the time box | Not production auth |
| 7 | Roles (editor / viewer) | Single "can edit" share | Cheap, shows clear intent | Slightly more UI and tests |
| 8 | Pure access function, 404 vs 403 | Checks inside each route | One place to test; no id probing | Slightly more indirection |
| 9 | Schema-as-sanitiser import | Sanitise HTML separately | Valid and safe by construction | Unsupported content is dropped |
| 10 | Last-write-wins saves | CRDT / operational transform | Out of scope for a time box | Concurrent editors can overwrite each other |
| 11 | Deploy on Vercel + Neon | Render + Neon (original plan) | Free with no card, no cold-start wait. **Changed mid-build: Render asked for a card.** | Migrations are a one-time manual step; 4 MB upload cap |
| 12 | Docker Compose for local | Run Node and Postgres by hand | One command, same stack as production | Docker build is slower than `npm run dev` |

## 10. Known limitations and risks

- **Comments:** one flat thread per document, no edit, no notifications, no anchoring to text. Enough for review notes, not a full review workflow.
- **Concurrent editing:** last write wins; there is no merge or presence. Two editors on one document can overwrite each other.
- **User enumeration:** sharing by email reveals whether an account exists. Acceptable for an internal tool; I'd avoid it with invite links in a public product.
- **Auth:** demo-grade (shared demo password, no rate limiting, no password reset).
- **CSRF:** relies on `SameSite=Lax` cookies; there are no CSRF tokens.
- **Import fidelity:** no images or tables from `.docx`; very large files are rejected.
- **Time display:** timestamps are rendered in UTC.
- **Operations:** migrations run manually (`npm run db:setup`), not on deploy.

## 11. What I would build next (with 2 to 4 more hours)

1. Browser end-to-end tests (Playwright) for the two-user sharing flow.
2. Optimistic concurrency (version number on save) with a conflict warning, then presence indicators.
3. Version history, then comments anchored to text selections.
4. Real auth (OIDC) with invite-by-link sharing and an audit trail.
5. Run migrations in CI/deploy rather than by hand.
