# Implementation Plan: Mobile UX & Tab Management

**Branch**: `003-mobile-ux` | **Date**: 2026-01-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-mobile-ux/spec.md`

## Summary

Make the FOH interface usable on mobile phones by implementing a single-column layout with bottom navigation, add sticky total in Tab Orders view, and add Close Tab functionality with confirmation dialogs. All changes are UI-only - no database modifications needed.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 18+, Tailwind CSS v4, shadcn/ui
**Storage**: Supabase (existing `close_tab` RPC already available)
**Testing**: Not explicitly requested per constitution (Ship Then Polish)
**Target Platform**: Web (responsive: mobile, tablet, desktop)
**Project Type**: Web application (React SPA)
**Performance Goals**: Standard web app responsiveness
**Constraints**: Mobile viewport < 768px must be single-column
**Scale/Scope**: Single bar application, existing FOH page enhancement

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity Over Scalability | ✅ PASS | Pure UI changes, no over-engineering |
| II. Minimal Dependencies | ✅ PASS | Uses existing Tailwind responsive utilities |
| III. No Custom Backend | ✅ PASS | Uses existing `close_tab` Supabase RPC |
| IV. Colocate Logic With UI | ✅ PASS | All changes in FrontOfHouse.tsx |
| V. Supabase As Source of Truth | ✅ PASS | Tab closure via existing RPC |
| VI. Type Everything | ✅ PASS | Existing types support tab status |
| VII. Ship Then Polish | ✅ PASS | Mobile usability is critical path |
| VIII. Fail Visibly | ✅ PASS | Confirmation dialogs for destructive actions |

**Gate Status**: ALL PASS - Proceed to implementation

## Project Structure

### Documentation (this feature)

```text
specs/003-mobile-ux/
├── plan.md              # This file
├── research.md          # Mobile responsive patterns
├── data-model.md        # No changes needed (existing schema)
├── quickstart.md        # Implementation guide
├── contracts/           # No new APIs (using existing Supabase)
└── tasks.md             # Task breakdown (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── lib/
│   └── utils.ts          # Existing utilities
├── pages/
│   ├── FrontOfHouse.tsx  # PRIMARY: Mobile layout + close tab + sticky total
│   └── Kitchen.tsx       # No changes needed
├── components/
│   └── ui/               # shadcn/ui components (existing)
└── types/
    └── database.ts       # Existing types (no changes)
```

**Structure Decision**: All changes confined to `FrontOfHouse.tsx`. Mobile responsiveness via Tailwind breakpoints, no new components needed.

## Complexity Tracking

> No violations to justify - all changes use existing patterns and dependencies.
