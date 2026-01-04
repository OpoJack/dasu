<!--
  SYNC IMPACT REPORT
  ==================
  Version change: 0.0.0 (template) → 1.0.0 (initial ratification)

  Modified principles: N/A (first ratification)

  Added sections:
    - Core Principles (8 principles defined)
    - Technology Stack (fixed dependencies)
    - Development Workflow (ship-first approach)
    - Governance (compliance rules)

  Removed sections: None (template placeholders replaced)

  Templates requiring updates:
    ✅ plan-template.md - Constitution Check section compatible
    ✅ spec-template.md - No changes needed (tech-agnostic)
    ✅ tasks-template.md - No changes needed (structure compatible)

  Follow-up TODOs: None
-->

# Dasu Constitution

## Core Principles

### I. Simplicity Over Scalability

This application serves one bar for one night. Every decision MUST favor the fastest path to a working product over architectural elegance or future-proofing. Do not design for hypothetical scale, multi-tenancy, or features that might be needed later.

### II. Minimal Dependencies

The stack is: **Vite, React, TypeScript, Tailwind, shadcn/ui, and Supabase**. Do not introduce additional libraries unless absolutely necessary to deliver a feature. When in doubt, use what's already there. Every new dependency requires explicit justification.

### III. No Custom Backend

All data persistence, querying, and real-time functionality MUST go through Supabase. Do not spin up a separate API server, serverless functions (beyond Supabase Edge Functions if needed), or any middleware layer. The frontend talks directly to Supabase.

### IV. Colocate Logic With UI

Keep components self-contained. Data fetching and subscriptions live in the components that need them. Do not prematurely abstract into custom hooks or context providers unless duplication becomes painful (3+ identical usages). Prefer copy-paste over wrong abstraction.

### V. Supabase As Source of Truth

The database is the source of truth for all state. Subscribe to changes and render what comes back. Avoid duplicating server state in client-side stores (no Redux, Zustand, or similar for data that lives in Supabase). Local component state is acceptable for UI-only concerns (modals, form inputs, loading states).

### VI. Type Everything

Use TypeScript for all code. Define types for database rows (generate from Supabase schema when possible) and use them consistently across components. No `any` types unless explicitly unavoidable and commented with rationale.

### VII. Ship Then Polish

Get each feature working end-to-end before refining the UI or handling edge cases. A working ugly screen beats a beautiful broken one. Priorities: functionality → correctness → usability → aesthetics.

### VIII. Fail Visibly

When something goes wrong—a failed insert, a dropped subscription, a network error—show the user an error. Do not swallow failures silently. Use toast notifications, inline error states, or explicit error boundaries. The user should always know when something didn't work.

## Technology Stack

**Fixed dependencies (do not deviate without constitution amendment):**

| Layer | Technology | Version |
|-------|------------|---------|
| Build | Vite | Latest stable |
| UI Framework | React | 18+ |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| Components | shadcn/ui | Latest |
| Backend/DB | Supabase | Latest |

**Prohibited without explicit justification:**
- State management libraries (Redux, Zustand, Jotai, etc.)
- Additional CSS frameworks or preprocessors
- Custom API servers or serverless functions (outside Supabase)
- ORMs or query builders (use Supabase client directly)
- Additional testing frameworks beyond what Vite provides

## Development Workflow

1. **Feature implementation order**: Working end-to-end → Edge cases → Polish
2. **Code organization**: Components own their data fetching; extract only when duplication is painful
3. **Error handling**: Every async operation MUST have visible error handling
4. **Type safety**: Generate database types from Supabase; no untyped data flows

## Governance

This constitution supersedes all other development practices for this project. Amendments require:

1. Explicit documentation of why the current principle is insufficient
2. Update to this file with version increment
3. Propagation check for affected specs and plans

All code contributions MUST verify compliance with these principles. Complexity beyond these constraints MUST be justified in the Complexity Tracking section of the relevant plan.md.

**Version**: 1.0.0 | **Ratified**: 2026-01-03 | **Last Amended**: 2026-01-03
