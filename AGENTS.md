# CrewCash — Project Instructions & Rules

> See [GEMINI.md](./GEMINI.md) for the primary Antigravity IDE rules and project specifications.

This file provides workspace rules and directives for autonomous coding agents working on the CrewCash repository.

---

## Quick Reference Summary

- **App**: CrewCash (Collaborative shared-budgeting web app for hackathon groups)
- **Stack**: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase (Postgres, Auth, Storage, RLS), Zod, Recharts
- **Key Invariants**:
  - **Integer cents only** (`amount_cents: number`). Never use floating-point numbers for money.
  - **No real money movement**: Non-custodial budgeting prototype.
  - **Deterministic Health Score**: Clamped 0–100, zero LLM hallucination for numbers.
  - **Approval Threshold**: Expenses $\ge$ threshold require 2 approvals to finalize; $< threshold$ are approved immediately.
  - **AI Safety**: Strict Zod schema parsing, timeouts, and deterministic fallbacks. AI failures must never break the demo.
  - **RLS**: Enforced via `is_crew_member(crew_id)` with server-side identity verification (`auth.uid()`).

For the full detailed specifications, schemas, mathematical formulas, and implementation roadmap, refer directly to [GEMINI.md](./GEMINI.md).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
