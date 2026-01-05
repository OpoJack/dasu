# API Contracts: Mobile UX & Tab Management

**Feature**: 003-mobile-ux
**Date**: 2026-01-04

## No New Contracts Required

This feature is UI-only and uses existing Supabase infrastructure.

## Existing APIs Used

### close_tab RPC

**Endpoint**: `supabase.rpc('close_tab', { p_tab_id: string })`

**Request**:
```typescript
{
  p_tab_id: string  // UUID of the tab to close
}
```

**Response**:
```typescript
number  // Final tab total (sum of all order items)
```

**Behavior**:
- Sets `tabs.status = 'closed'`
- Sets `tabs.closed_at = now()`
- Returns calculated total for receipt/confirmation

**Error Cases**:
- Tab not found: Supabase returns null
- Tab already closed: Operation is idempotent (no error)

### tabs Query (existing)

**Endpoint**: `supabase.from('tabs').select(...).eq('status', 'open')`

Already filtered to `status = 'open'` in current implementation. Closed tabs automatically disappear from the list.

## Real-time Subscriptions

Existing subscription on `tabs` table will automatically handle:
- Tab closure by another user → tab removed from list
- Updates to tab status propagate to all connected clients

No subscription changes needed.
