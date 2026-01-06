# Implementation Plan: Edit Order After Submission

**Branch**: `004-edit-order` | **Date**: 2026-01-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-edit-order/spec.md`

## Summary

Enable front-of-house staff to edit in-progress orders by adding an Edit button to the Tab Orders section that loads order items into the Current Order section for modification. The kitchen display already shows editing status (yellow border + "BEING EDITED - HOLD") and disables completion—this feature adds the frontend editing workflow to trigger that status. Mobile navigation will rename "Close Out" to "Orders" for parity.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18+
**Primary Dependencies**: Vite, Tailwind CSS, shadcn/ui, Supabase JS Client
**Storage**: Supabase PostgreSQL (existing schema with `orders.status = 'editing'` and `start_order_edit`/`finish_order_edit` RPCs)
**Testing**: Manual testing (no automated test framework currently configured)
**Target Platform**: Web browser (responsive: desktop and mobile)
**Project Type**: Single frontend application (Vite + React)
**Performance Goals**: Real-time updates via Supabase subscriptions (<2s latency)
**Constraints**: Must work offline-resilient (graceful degradation on network errors per constitution)
**Scale/Scope**: One bar, one night—no multi-tenancy or concurrent editing conflicts beyond simple locking

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity Over Scalability | ✅ PASS | Feature uses existing order status and RPCs, no new abstractions |
| II. Minimal Dependencies | ✅ PASS | No new libraries needed |
| III. No Custom Backend | ✅ PASS | Uses existing Supabase RPCs (`start_order_edit`, `finish_order_edit`) |
| IV. Colocate Logic With UI | ✅ PASS | Edit state managed in FrontOfHouse component |
| V. Supabase As Source of Truth | ✅ PASS | Order status change persisted to DB, UI reacts to subscriptions |
| VI. Type Everything | ✅ PASS | Existing types cover Order, OrderItem; OrderDraftItem exists for edit state |
| VII. Ship Then Polish | ✅ PASS | Core editing first, cancel functionality second |
| VIII. Fail Visibly | ✅ PASS | Toast notifications for edit failures, status update errors |

**Gate Result**: PASS - No constitution violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/004-edit-order/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (Supabase RPC contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── ui/              # shadcn/ui components
├── hooks/
│   └── use-theme.ts     # Theme hook
├── lib/
│   ├── supabase.ts      # Supabase client
│   └── utils.ts         # Timing utilities
├── pages/
│   ├── FrontOfHouse.tsx # Primary changes: Edit button, edit state management
│   └── Kitchen.tsx      # Already handles 'editing' status (no changes needed)
└── types/
    └── database.ts      # Order, OrderItem types (no changes needed)
```

**Structure Decision**: Single frontend application. All changes confined to `src/pages/FrontOfHouse.tsx` (edit workflow) with potential extraction of shared order rendering if duplication becomes painful.

## Complexity Tracking

> No constitution violations identified. Table not required.
