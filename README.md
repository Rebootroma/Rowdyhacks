# CrewCash Build Pack

This pack contains the implementation blueprint for CrewCash.

Files:

- `GEMINI.md` — project rules and instructions tailored for Antigravity IDE
- `AGENTS.md` — agent instructions reference
- `CREWCASH_TECHNICAL_SPEC.md` — complete product and engineering specification
- `CREWCASH_AI_BUILD_INSTRUCTIONS.md` — instructions for an AI coding agent and in-app AI prompts
- `CREWCASH_SUPABASE_SCHEMA.sql` — starter Postgres/Supabase schema with baseline RLS
- `CREWCASH_ENV_EXAMPLE.txt` — environment-variable template

Recommended first steps:

1. Read the technical spec and `GEMINI.md`.
2. Create a Next.js + TypeScript project.
3. Create Supabase project.
4. Apply and review the schema.
5. Configure environment variables.
6. Build features in the priority order listed in the spec.
7. Keep `GEMINI.md` in the repository root so Antigravity IDE loads it as active workspace context.

Important: this is a hackathon prototype. CrewCash should not collect bank credentials or move real money.

