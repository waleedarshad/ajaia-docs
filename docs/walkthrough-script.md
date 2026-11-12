# Walkthrough video script (target about 4:00, hard limit 5:00)

Record the **live site** (Vercel URL) with a normal window plus a private window for the second user.
Have one `.md` and one `.docx` file ready on your desktop. Open the site once before recording so nothing is slow.
Say it in your own words; these are talking points, not lines to read.

| Time | Show | Say |
|---|---|---|
| 0:00 | Dashboard (signed out, then sign in as Alice) | "This is Ajaia Docs, a lightweight collaborative editor I built in the time box. I prioritised a working end-to-end slice: edit, import, share, persist." |
| 0:25 | New document, type a title line, make a heading, bold/italic/underline, a bullet and a numbered list; watch "Saved" | "Rich-text editing with TipTap. It autosaves after a second, one request at a time so a slow save can't overwrite newer text." |
| 1:00 | Refresh the page; then rename from the header | "Content is stored as the editor's JSON in Postgres, so formatting survives a refresh." |
| 1:20 | Upload the `.md` file, then the `.docx` | "Upload turns .txt, .md or .docx into a new editable document. Everything is parsed against the editor's own schema, which also acts as the sanitiser. Limits are shown next to the button: 4 MB." (Optionally show the error for a .pdf.) |
| 2:00 | Open a doc, Share, add bob (Can edit) and carol (View only) | "Sharing is by email with two roles. Only the owner manages sharing." |
| 2:30 | Private window: Bob sees it under Shared with me and edits; Carol sees a read-only editor | "Editors can edit, viewers are read-only, and the server enforces it, not just the UI." |
| 3:05 | Back as Alice: remove Carol; refresh Carol's page: "not found" | "Revoking takes effect immediately; users with no access get a 404 so ids can't be probed." |
| 3:20 | Slide or the README/architecture file | "Deliberate cuts: real-time collaboration, comments, version history, real auth. Key decisions: one Next.js app with a service layer, access rules in one pure function with 33 tests, Docker Compose locally, Vercel and Neon in production." |
| 3:50 | docs/AI_WORKFLOW.md | "I used Claude phase by phase and approved each step. It sped up scaffolding, the editor and tests. I rejected a separate backend and real-time collaboration, caught a coupling bug through tests, and moved off Render when it asked for a card. I ran Docker and the database myself to verify." |
| 4:20 | End | "Next with more time: Playwright tests, conflict warnings, export, real auth." |
