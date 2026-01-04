# Research: Order Status Visibility & Timing Indicators

**Feature**: 002-order-status-visibility
**Date**: 2026-01-04

## Overview

This feature is a UI enhancement to existing functionality. No new technical unknowns or dependencies are introduced. Research focuses on implementation patterns within the existing codebase.

---

## Decision 1: Timing Threshold Constants

**Decision**: Define timing thresholds as module-level constants in a shared location (utils.ts)

**Rationale**:
- Thresholds (6 min, 12 min) are used in both FOH and Kitchen views
- Constants ensure consistency and make future adjustments trivial
- Per constitution IV, only extract when duplication becomes painful - but constants are acceptable

**Alternatives considered**:
- Inline magic numbers: Rejected - violates DRY, makes threshold changes error-prone
- Config file/env vars: Rejected - over-engineering for fixed values per spec assumptions
- Database config: Rejected - violates constitution I (simplicity) for a UI-only concern

**Implementation**:
```typescript
// src/lib/utils.ts
export const TIMING_THRESHOLDS = {
  WARNING_MINUTES: 6,
  URGENT_MINUTES: 12,
} as const
```

---

## Decision 2: Timing State Calculation

**Decision**: Pure function that returns timing state based on created_at timestamp

**Rationale**:
- Calculation is stateless - input timestamp, output state
- Can be called on each render/interval without side effects
- Aligns with React's functional component model

**Alternatives considered**:
- Class-based timer: Rejected - overkill for simple elapsed time calculation
- useEffect-based state: Rejected - unnecessary complexity when calculation is pure

**Implementation**:
```typescript
type TimingState = 'normal' | 'warning' | 'urgent'

export function getTimingState(createdAt: string): TimingState {
  const minutes = (Date.now() - new Date(createdAt).getTime()) / 60000
  if (minutes >= TIMING_THRESHOLDS.URGENT_MINUTES) return 'urgent'
  if (minutes >= TIMING_THRESHOLDS.WARNING_MINUTES) return 'warning'
  return 'normal'
}
```

---

## Decision 3: Tab Total Calculation

**Decision**: Calculate totals client-side from loaded order_items data

**Rationale**:
- FOH already loads tabs with orders and order_items (existing query)
- price_at_order field captures price at time of order
- Client-side sum is fast for ~15 orders per tab
- Avoids additional database queries or RPC calls

**Alternatives considered**:
- Supabase RPC (get_tab_total): Exists but requires separate call; unnecessary when data is already loaded
- Database view: Over-engineering for simple sum
- Stored total column: Adds complexity, sync issues, violates single source of truth

**Implementation**:
```typescript
function calculateTabTotal(tab: TabWithOrders): number {
  return tab.orders.reduce((total, order) =>
    total + order.order_items.reduce((orderSum, item) =>
      orderSum + item.quantity * item.price_at_order, 0
    ), 0
  )
}
```

---

## Decision 4: Timing Indicator Visual Treatment

**Decision**: Use Tailwind color classes consistent with existing UI patterns

**Rationale**:
- Kitchen.tsx already uses color coding for elapsed time (yellow, orange, red)
- Extend same pattern to FOH for consistency (FR-006)
- No additional CSS needed

**Color mapping**:
| State | Tailwind Classes | Existing Usage |
|-------|------------------|----------------|
| normal | text-muted-foreground | Default text |
| warning | text-yellow-500, text-orange-500 | Kitchen 5-10 min |
| urgent | text-red-500 font-bold | Kitchen 15+ min |

**Adjustment**: Align Kitchen thresholds with new spec (6/12 min instead of 5/10/15 min)

---

## Decision 5: Order Status Display in FOH

**Decision**: Add status badge to order display within tab detail view

**Rationale**:
- Orders already have status field ('in_progress', 'editing', 'complete')
- Badge component pattern used elsewhere in shadcn/ui
- Keeps display compact while conveying state

**Visual treatment**:
| Status | Badge Style |
|--------|-------------|
| in_progress | Default/primary |
| editing | Yellow/warning |
| complete | Green/success |

---

## Decision 6: Detailed Breakdown View

**Decision**: Expand tab card to show full order breakdown when selected

**Rationale**:
- FOH already has selected tab concept (selectedTab state)
- Right panel shows order draft; can show breakdown when not drafting
- No navigation/modal needed - inline expansion

**Alternatives considered**:
- Modal dialog: Rejected - adds friction, not needed for simple list view
- Separate route: Rejected - over-engineering, breaks flow
- Accordion per order: Considered - may use for individual order expansion

---

## Decision 7: Timer Update Interval

**Decision**: Use existing 30-second interval from Kitchen.tsx

**Rationale**:
- Kitchen already has `setInterval(() => setNow(Date.now()), 30000)`
- 30 seconds is adequate granularity for minute-based thresholds
- Lower intervals would waste CPU cycles for no user benefit

**Implementation**: Reuse same pattern in FOH, or share interval state if both views mounted (unlikely in practice)

---

## Decision 8: Real-time Status Updates

**Decision**: Leverage existing Supabase subscription pattern

**Rationale**:
- FOH already subscribes to order completions for toast notifications
- Extend to update displayed order statuses
- loadTabs() already refreshes full tab state

**Implementation**: Existing subscription already triggers loadTabs() on order status changes - status display will update automatically.

---

## No Research Needed

The following items were considered but require no research:
- **Data model changes**: None needed - existing schema has all required fields
- **API contracts**: No new endpoints - using existing Supabase queries
- **New dependencies**: None - using existing stack per constitution
- **Performance concerns**: Simple calculations, existing query patterns adequate
