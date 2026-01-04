# Data Model: Order Status Visibility & Timing Indicators

**Feature**: 002-order-status-visibility
**Date**: 2026-01-04

## Overview

This feature requires **no database schema changes**. All data needed for order status visibility, tab totals, and timing indicators already exists in the current schema.

## Existing Entities (Unchanged)

### orders

| Field | Type | Usage in this Feature |
|-------|------|----------------------|
| id | uuid | Order identifier |
| status | text ('in_progress', 'editing', 'complete') | **FR-001**: Display status in FOH |
| created_at | timestamptz | **FR-004, FR-005**: Calculate elapsed time for timing indicators |
| completed_at | timestamptz | Display completion time for completed orders |

### order_items

| Field | Type | Usage in this Feature |
|-------|------|----------------------|
| order_id | uuid | Link to parent order |
| quantity | integer | **FR-003**: Display in breakdown view |
| price_at_order | decimal | **FR-002, FR-003**: Calculate totals |

### tabs

| Field | Type | Usage in this Feature |
|-------|------|----------------------|
| id | uuid | Tab identifier |
| name | text | Display in breakdown view |
| status | text | Filter for open tabs |

### menu_items

| Field | Type | Usage in this Feature |
|-------|------|----------------------|
| name | text | **FR-003**: Display item names in breakdown |

## Calculated Values (Client-Side)

These values are derived from existing data, not stored:

### Tab Total
- **Calculation**: Sum of (quantity × price_at_order) for all order_items across all orders in the tab
- **Source fields**: order_items.quantity, order_items.price_at_order
- **Used by**: FR-002 (tab list total), FR-003 (breakdown grand total)

### Order Subtotal
- **Calculation**: Sum of (quantity × price_at_order) for order_items in a single order
- **Source fields**: order_items.quantity, order_items.price_at_order
- **Used by**: FR-003 (order subtotals in breakdown)

### Order Age / Timing State
- **Calculation**: (current_time - created_at) in minutes → map to normal/warning/urgent
- **Source field**: orders.created_at
- **Thresholds**: <6 min = normal, 6-12 min = warning, >12 min = urgent
- **Used by**: FR-004, FR-005, FR-006 (timing indicators)

## Type Definitions (No Changes)

Existing types from `src/types/database.ts` are sufficient:

```typescript
// Already defined - no changes needed
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type Tab = Database['public']['Tables']['tabs']['Row']
export type MenuItem = Database['public']['Tables']['menu_items']['Row']

// Already defined - includes nested relations
export type OrderWithItems = Order & {
  order_items: (OrderItem & { menu_item: MenuItem })[]
  tab: Tab
}

// Already defined in FrontOfHouse.tsx
type TabWithOrders = Tab & {
  orders: OrderWithDetails[]
}
```

## New Type (Optional Helper)

If timing state is typed explicitly:

```typescript
// src/lib/utils.ts
export type TimingState = 'normal' | 'warning' | 'urgent'
```

## Relationships Diagram

```
┌─────────────────┐
│      tabs       │
│─────────────────│
│ id              │◄──────────────┐
│ name            │               │
│ status          │               │
└─────────────────┘               │
                                  │
┌─────────────────┐               │
│     orders      │               │
│─────────────────│               │
│ id              │◄──────────┐   │
│ tab_id          │───────────┼───┘
│ status ◄────────│─────[FR-001: Display status]
│ created_at ◄────│─────[FR-004/005: Timing calculation]
│ completed_at    │               │
└─────────────────┘               │
                                  │
┌─────────────────┐               │
│   order_items   │               │
│─────────────────│               │
│ id              │               │
│ order_id        │───────────────┘
│ menu_item_id    │───────────────┐
│ quantity ◄──────│─────[FR-002/003: Total calculation]
│ price_at_order◄─│─────[FR-002/003: Total calculation]
└─────────────────┘               │
                                  │
┌─────────────────┐               │
│   menu_items    │               │
│─────────────────│               │
│ id              │◄──────────────┘
│ name ◄──────────│─────[FR-003: Item names in breakdown]
│ price           │
└─────────────────┘
```

## Migration Requirements

**None** - This feature is purely a UI enhancement using existing data.
