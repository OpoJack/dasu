# Data Model: Mobile UX & Tab Management

**Feature**: 003-mobile-ux
**Date**: 2026-01-04

## Schema Changes

**No database changes required.**

This feature is UI-only. All necessary schema elements already exist.

## Existing Schema (Reference)

### tabs table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Tab name (e.g., "Table 5") |
| status | enum | 'open' \| 'closed' |
| created_at | timestamptz | When tab was created |
| closed_at | timestamptz \| null | When tab was closed |

### orders table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| tab_id | uuid | Foreign key to tabs |
| status | enum | 'in_progress' \| 'editing' \| 'complete' |
| ... | ... | Other fields unchanged |

## Existing RPC Functions

### close_tab(p_tab_id uuid) → number

Already implemented in Supabase:
- Sets `tabs.status = 'closed'`
- Sets `tabs.closed_at = now()`
- Returns the final tab total

This function will be used directly from the UI.

## Type Definitions

Existing types in `src/types/database.ts` already support all needed operations:

```typescript
export type Tab = {
  id: string
  name: string
  status: 'open' | 'closed'
  created_at: string
  closed_at: string | null
}
```

No type changes needed.
