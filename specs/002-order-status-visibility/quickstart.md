# Quickstart: Order Status Visibility & Timing Indicators

**Feature**: 002-order-status-visibility
**Date**: 2026-01-04

## Prerequisites

- Completed setup from `specs/001-bar-kitchen-orders/quickstart.md`
- Working FOH and Kitchen displays
- Supabase database with existing schema

## What This Feature Adds

This is a **UI-only enhancement** - no database changes or new dependencies required.

### FOH Enhancements
1. **Tab totals** displayed in the Open Tabs sidebar
2. **Order status** (in progress/editing/complete) shown per order
3. **Detailed breakdown view** with itemized costs
4. **Timing indicators** showing order age with color coding

### Kitchen Enhancements
1. **Updated timing thresholds**: <6 min (normal), 6-12 min (warning), >12 min (urgent)
2. **Consistent color scheme** with FOH

## Implementation Steps

### Step 1: Add Timing Utilities

Create or update `src/lib/utils.ts`:

```typescript
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

### Step 2: Update FrontOfHouse.tsx

Key changes:
1. Add tab total calculation and display in sidebar
2. Show order status badges in tab detail view
3. Add timing indicators to orders
4. Create detailed breakdown section

### Step 3: Update Kitchen.tsx

Key changes:
1. Update `getElapsedClass()` to use new thresholds (6/12 min)
2. Import and use shared timing utilities for consistency

## Verification

### Test Tab Totals
1. Create a tab with multiple orders
2. Verify total appears in Open Tabs sidebar
3. Submit new order → total updates

### Test Order Status
1. Submit order from FOH
2. Verify status shows "In Progress" on FOH
3. Mark complete in Kitchen
4. Verify status updates to "Complete" on FOH (real-time)

### Test Timing Indicators
1. Submit new order → appears with normal color
2. Wait 6+ minutes → changes to warning (orange)
3. Wait 12+ minutes → changes to urgent (red)
4. Mark complete → timing indicator removed

### Test Detailed Breakdown
1. Select tab with orders
2. View breakdown showing:
   - Each order with items, quantities, prices
   - Order subtotals
   - Grand total

## Troubleshooting

### Timing not updating?
- Check that the 30-second interval is running (`setNow(Date.now())`)
- Verify `created_at` timestamps are in correct timezone

### Totals incorrect?
- Verify `price_at_order` is being used (not current menu price)
- Check order_items are loading with tab query

### Status not updating in real-time?
- Check Supabase subscription is active
- Verify `loadTabs()` is called on order update events
