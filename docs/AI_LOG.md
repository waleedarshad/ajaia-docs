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
- Verified by: `prisma validate`, `next build`, `docker compose up` locally, login/logout round trip.
