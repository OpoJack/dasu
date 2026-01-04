# Implementation Plan: Bar Kitchen Order System

**Branch**: `001-bar-kitchen-orders` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-bar-kitchen-orders/spec.md`

## Summary

Build a real-time communication bridge between front of house and kitchen at a bar. Staff create tabs for customers, submit orders that instantly appear on the kitchen display with audio alerts, and the kitchen marks orders complete to notify front of house. The system uses React for the frontend (Vercel-hosted) and Supabase for real-time PostgreSQL backend, enabling instant order updates without polling.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Vite, React 18+, Tailwind CSS, shadcn/ui, Supabase JS Client
**Storage**: Supabase (hosted PostgreSQL with real-time subscriptions)
**Testing**: Vitest (Vite built-in)
**Target Platform**: Web (responsive for tablets/desktop), Vercel hosting
**Project Type**: Web application (single frontend connecting to Supabase BaaS)
**Performance Goals**: Order transmission <2 seconds, kitchen display supports 15+ concurrent orders
**Constraints**: Real-time updates required, audio alerts in kitchen environment (70+ dB)
**Scale/Scope**: Single bar location, one night of service, ~50-100 orders

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verified against Dasu Constitution v1.0.0:

- [x] **I. Simplicity Over Scalability**: Single bar, one night—no multi-tenancy or scaling concerns
- [x] **II. Minimal Dependencies**: Using only approved stack (Vite, React, TS, Tailwind, shadcn/ui, Supabase)
- [x] **III. No Custom Backend**: All data through Supabase, no API server
- [x] **IV. Colocate Logic With UI**: Components own their subscriptions and data fetching
- [x] **V. Supabase As Source of Truth**: Real-time subscriptions, no client-side state duplication
- [x] **VI. Type Everything**: Database types generated from Supabase schema
- [x] **VII. Ship Then Polish**: P1 stories first, edge cases later
- [x] **VIII. Fail Visibly**: Toast notifications for all async errors

No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-bar-kitchen-orders/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (Supabase table schemas, RPC functions)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/          # Shared UI components (shadcn/ui based)
│   └── ui/              # shadcn/ui components
├── pages/               # Route-level page components (own their data)
│   ├── FrontOfHouse.tsx # Tab management, order entry (colocated logic)
│   └── Kitchen.tsx      # Kitchen display view (colocated subscriptions)
├── types/               # TypeScript type definitions
│   └── database.ts      # Supabase generated types
└── lib/
    └── supabase.ts      # Supabase client initialization
```

**Structure Decision**: Minimal structure per constitution. Pages own their data fetching and subscriptions directly. No separate hooks/ or services/ directories—logic lives in components until duplication becomes painful (3+ usages). shadcn/ui provides base components.

## Complexity Tracking

> No violations requiring justification. Architecture is straightforward BaaS pattern.
