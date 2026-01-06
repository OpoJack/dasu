# Data Model: Edit Order After Submission

**Feature**: 004-edit-order
**Date**: 2026-01-05
**Status**: Complete

## Overview

This feature requires **no database schema changes**. All necessary entities and relationships already exist. This document describes the existing data model and how it supports the edit workflow.

---

## Existing Entities

### Order

Represents a submitted order with its lifecycle status.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid (PK) | Unique order identifier |
| tab_id | uuid (FK → tabs) | Parent tab this order belongs to |
| status | enum | Order lifecycle: `in_progress`, `editing`, `complete` |
| edited_by | uuid? | Reserved for tracking who is editing (currently nullable) |
| notes | text? | Order-level notes (e.g., "rush order") |
| created_at | timestamp | When order was submitted |
| completed_at | timestamp? | When order was marked complete |

**Status Transitions**:
```
[New Order]
     ↓
in_progress ←→ editing
     ↓
  complete
```

- `in_progress` → `editing`: When staff clicks Edit (via `start_order_edit` RPC)
- `editing` → `in_progress`: When staff saves or cancels edit (via `finish_order_edit` RPC)
- `in_progress` → `complete`: When kitchen marks complete (via `complete_order` RPC)
- `editing` → `complete`: **Not allowed** (button disabled in Kitchen UI)

### Order Item

Individual line items within an order.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid (PK) | Unique item identifier |
| order_id | uuid (FK → orders) | Parent order |
| menu_item_id | uuid (FK → menu_items) | Menu item ordered |
| quantity | integer | Count of items |
| price_at_order | decimal | Price snapshot at order time |
| notes | text? | Item-specific notes (e.g., "no onions") |

**Edit Behavior**: When an order is edited, all order_items are deleted and recreated with current data. The `price_at_order` is re-snapshotted to reflect current menu prices.

### Menu Item

Reference data for items that can be ordered.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid (PK) | Unique menu item identifier |
| name | string | Display name |
| price | decimal | Current price |
| category | string | Grouping (e.g., "Skewers", "Drinks") |
| available | boolean | Whether item can be ordered |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last modification timestamp |

### Tab

Groups orders for a customer or table.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid (PK) | Unique tab identifier |
| name | string | Customer/table name |
| status | enum | `open` or `closed` |
| created_at | timestamp | When tab was opened |
| closed_at | timestamp? | When tab was closed |

---

## Client-Side State (No Database Persistence)

### Order Draft Item

Temporary client state for building/editing orders. **Not persisted to database until submit/save.**

| Field | Type | Description |
|-------|------|-------------|
| menuItem | MenuItem | Full menu item object |
| quantity | number | Count (1+) |
| notes | string | Item-specific notes |

### Edit State (New for this feature)

Additional client state to track editing context:

| Field | Type | Description |
|-------|------|-------------|
| editingOrderId | string \| null | ID of order being edited, null if creating new |
| originalOrderItems | OrderDraftItem[] | Snapshot for cancel restoration |

---

## Relationships

```
Tab (1) ─────┬───── (*) Order
             │
             └─ Orders belong to one tab

Order (1) ───┬───── (*) Order Item
             │
             └─ Order items belong to one order

Order Item (*) ───── (1) Menu Item
             │
             └─ Each order item references one menu item
```

---

## Validation Rules

### Order
- **Status transitions**: Only valid transitions allowed (see diagram above)
- **Tab association**: Order must belong to an open tab
- **Edit lock**: Only one user can edit an order at a time (enforced by `start_order_edit` RPC returning false if already editing)

### Order Item
- **Minimum items**: Order must have at least 1 item (client-side validation on save)
- **Valid menu item**: Must reference an existing menu item
- **Positive quantity**: quantity ≥ 1
- **Price snapshot**: Must capture current menu price at order/edit time

### Edit Constraints
- **Editable status**: Only orders with status `in_progress` can be edited
- **Same tab**: Editing reuses the existing tab association (no tab changes)
- **No concurrent edits**: Edit button disabled if order status is already `editing`

---

## No Schema Changes Required

This feature uses existing database infrastructure:

| Capability | Existing Support |
|------------|------------------|
| Order editing status | `orders.status = 'editing'` |
| Edit lock management | `start_order_edit()` and `finish_order_edit()` RPCs |
| Order item CRUD | Standard Supabase table operations |
| Real-time updates | Existing `orders` table subscription |
| Type definitions | `src/types/database.ts` has all types |

---

## Migration Notes

**None required.** The database schema already supports all edit functionality.
