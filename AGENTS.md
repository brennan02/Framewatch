# AGENTS.md

## FrameWatch MVP Scope
- This project is the **FrameWatch MVP** for **Tuckertown Buildings only** (single-company MVP).
- The app tracks **construction materials, usage, waste, and salvage**.
- The workflow is intended to be **QR-based**, but full QR implementation is not required yet.

## Core Guardrails
- Keep the MVP simple.
- **Do not** introduce multi-tenant architecture.
- **Do not** add billing, authentication systems, or enterprise-only features.
- **Do not** refactor large parts of the codebase unless explicitly asked.

## Data Rules
- Use **mock data only** for now.
- Data should come from: `src/lib/mock-data.ts`.
- **Do not** introduce databases (including Supabase) at this stage.

## Import Conventions
- Prefer **relative imports** (for example: `../../lib/mock-data`).
- Avoid `@` alias imports unless they are explicitly confirmed to be working for the specific change.

## Change Strategy
- Make small, safe, PR-sized changes.
- Keep edits minimal and focused on the requested task.
- Do not modify unrelated files.
- Do not add new dependencies unless explicitly required.

## UI & Styling
- Maintain the existing **dark, industrial** visual style.
- Keep UI mobile-friendly.
- Match layout patterns already used in the **home**, **dashboard**, and **scan** pages.

## File Organization
- Use `src/app` for routes.
- Use `src/components` for reusable UI only when needed.
- Do not move or restructure project files without explicit instruction.

## Output Expectations
- Keep implementation minimal, focused, and working.
- Ensure code compiles without TypeScript errors.
- Do not leave placeholder, partial, or broken code.

## Development Priorities
Prioritize work related to:
1. Materials tracking
2. Scan workflow
3. Waste tracking

Avoid building features not directly related to these MVP priorities.
