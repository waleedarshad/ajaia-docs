# Walkthrough video script (target about 4:30, hard limit 5:00)

Record the **live site** (Vercel URL) with a normal window plus a private window for the second user.
Have one `.md` and one `.docx` file ready on your desktop. Open the site once before recording so nothing is slow.
Say it in your own words; these are talking points, not lines to read.

| Time | Show | Say |
|---|---|---|
| 0:00 | Dashboard (signed out, then sign in as Alice) | "This is Ajaia Docs, a lightweight collaborative editor I built in the time box. I prioritised a working end-to-end slice: edit, import, share, persist." |
| 0:20 | New document, type a title line, make a heading, bold/italic/underline, a bullet and a numbered list; watch "Saved" | "Rich-text editing with TipTap. It autosaves after a second, one request at a time so a slow save can't overwrite newer text." |
| 0:50 | Refresh the page; then rename from the header | "Content is stored as the editor's JSON in Postgres, so formatting survives a refresh." |
| 1:05 | Upload the `.md` file, then the `.docx` | "Upload turns .txt, .md or .docx into a new editable document. Everything is parsed against the editor's own schema, which also acts as the sanitiser. Limit is 4 MB." (Skip the .pdf error demo if short on time.) |
| 1:50 | Open a doc, Share, add bob (Can edit) and carol (View only) | "Sharing is by email with two roles. Only the owner manages sharing." |
| 2:15 | Private window: Bob sees it under Shared with me and edits; Carol sees a read-only editor | "Editors can edit, viewers are read-only, and the server enforces it, not just the UI." |
| 2:50 | As Carol (view only) post a comment; back as Alice, see it and delete it | "Everyone who can open a document can comment, even view-only users. Authors and the owner can delete. It's one flat thread per document; anchoring comments to text selections was out of scope." |
| 3:15 | As Alice click Export .md (show the file), then Export PDF (show the print preview) | "Markdown comes from a small serializer over the editor JSON. PDF uses the browser's print dialog with a print stylesheet, so no headless browser is needed on Vercel." |
| 3:35 | Remove Carol; refresh Carol's page: "not found" | "Revoking takes effect immediately; users with no access get a 404 so ids can't be probed." |
| 3:50 | Slide or the README/architecture file | "Deliberate cuts: real-time collaboration, suggestion mode, version history, real auth. Key decisions: one Next.js app with a service layer, access rules in one pure function with 41 tests, Docker Compose locally, Vercel and Neon in production." |
| 4:10 | docs/AI_WORKFLOW.md | "I used Claude phase by phase and approved each step. It sped up scaffolding, the editor and tests. I rejected a separate backend and real-time collaboration, caught a coupling bug through tests, and moved off Render when it asked for a card. I ran Docker and the database myself to verify." |
| 4:30 | End | "Next with more time: Playwright tests, conflict warnings, version history, text-anchored comments, real auth." |
