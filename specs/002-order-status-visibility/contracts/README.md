# Contracts: Order Status Visibility & Timing Indicators

**Feature**: 002-order-status-visibility
**Date**: 2026-01-04

## No New Contracts Required

This feature is a **UI-only enhancement** that uses existing Supabase queries and data structures. No new API endpoints, database functions, or schema changes are needed.

### Existing Queries (Unchanged)

The feature relies on these existing patterns:

**FOH - Load Tabs with Orders**:
```typescript
supabase
  .from('tabs')
  .select(`
    *,
    orders (
      *,
      order_items (
        *,
        menu_item:menu_items (*)
      )
    )
  `)
  .eq('status', 'open')
  .order('created_at', { ascending: false })
```

**Kitchen - Load Active Orders**:
```typescript
supabase
  .from('orders')
  .select(`
    *,
    tab:tabs (*),
    order_items (
      *,
      menu_item:menu_items (*)
    )
  `)
  .in('status', ['in_progress', 'editing'])
  .order('created_at', { ascending: true })
```

### Existing Subscriptions (Unchanged)

**Kitchen - Order Changes**:
```typescript
supabase.channel('kitchen-orders')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, ...)
```

**FOH - Order Completions**:
```typescript
supabase.channel('foh-ready')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: 'status=eq.complete' }, ...)
```

### New Utility Functions (Client-Side Only)

These are TypeScript functions, not database contracts:

```typescript
// src/lib/utils.ts

export const TIMING_THRESHOLDS = {
  WARNING_MINUTES: 6,
  URGENT_MINUTES: 12,
} as const

export type TimingState = 'normal' | 'warning' | 'urgent'

export function getTimingState(createdAt: string): TimingState {
  const minutes = (Date.now() - new Date(createdAt).getTime()) / 60000
  if (minutes >= TIMING_THRESHOLDS.URGENT_MINUTES) return 'urgent'
  if (minutes >= TIMING_THRESHOLDS.WARNING_MINUTES) return 'warning'
  return 'normal'
}

export function getTimingClass(state: TimingState): string {
  switch (state) {
    case 'urgent': return 'text-red-500 font-bold'
    case 'warning': return 'text-orange-500 font-semibold'
    default: return 'text-muted-foreground'
  }
}
```

## Summary

| Contract Type | Changes Required |
|---------------|-----------------|
| Database Schema | None |
| RPC Functions | None |
| REST Endpoints | None (Supabase auto-generated) |
| Real-time Subscriptions | None (existing sufficient) |
| Client Utilities | New timing functions (not contracts) |
