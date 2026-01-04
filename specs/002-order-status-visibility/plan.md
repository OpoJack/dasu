# Implementation Plan: Order Status Visibility & Timing Indicators

**Branch**: `002-order-status-visibility` | **Date**: 2026-01-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-order-status-visibility/spec.md`

## Summary

Enhance FOH and Kitchen displays with order status visibility, tab totals, detailed breakdown views, and time-based urgency indicators. This is a UI enhancement feature that extends existing components without new database tables - all required data (order status, created_at, price_at_order) already exists.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 18+, Tailwind CSS, shadcn/ui, Supabase (existing stack)
**Storage**: Supabase PostgreSQL (existing schema - no changes needed)
**Testing**: Manual testing (per constitution VII - Ship Then Polish)
**Target Platform**: Web browser (responsive for tablets)
**Project Type**: Web application (frontend only)
**Performance Goals**: Timing indicators update every 30 seconds; real-time order status updates
**Constraints**: Must work on bar tablets; must not introduce additional dependencies
**Scale/Scope**: Single bar, ~15 concurrent orders, 2 views (FOH, Kitchen)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity Over Scalability | PASS | Pure UI enhancement; no new abstractions |
| II. Minimal Dependencies | PASS | Using existing stack only |
| III. No Custom Backend | PASS | All data from existing Supabase schema |
| IV. Colocate Logic With UI | PASS | Timer logic and calculations stay in components |
| V. Supabase As Source of Truth | PASS | Reading existing order/tab data; no new client state |
| VI. Type Everything | PASS | Using existing Database types |
| VII. Ship Then Polish | PASS | Core visibility first, then refinements |
| VIII. Fail Visibly | PASS | Toast errors already in place |

**Gate Result**: PASS - No violations. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-order-status-visibility/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal - no schema changes)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (none needed - no API changes)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/ui/       # shadcn/ui components (existing)
├── pages/
│   ├── FrontOfHouse.tsx # Extend: add order status, tab totals, breakdown view
│   ├── Kitchen.tsx      # Extend: update timing indicators to use shared thresholds
│   └── Auth.tsx         # Unchanged
├── types/database.ts    # Unchanged (existing types sufficient)
└── lib/
    ├── supabase.ts      # Unchanged
    └── utils.ts         # May add timing helper functions
```

**Structure Decision**: Extend existing pages. No new components needed - all changes are inline enhancements to FrontOfHouse.tsx and Kitchen.tsx. Timing calculation logic may be extracted to utils.ts for sharing between views.

## Complexity Tracking

No violations to justify - feature fully aligns with constitution.
