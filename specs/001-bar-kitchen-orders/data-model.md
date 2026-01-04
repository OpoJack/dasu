# Data Model: Bar Kitchen Order System

**Branch**: `001-bar-kitchen-orders` | **Date**: 2026-01-03

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│    tabs     │──────<│   orders    │──────<│ order_items  │>──────│ menu_items  │
└─────────────┘  1:N  └─────────────┘  1:N  └──────────────┘  N:1  └─────────────┘
```

---

## Tables

### 1. tabs

Represents a customer session at the bar.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Unique identifier |
| name | text | NOT NULL | Customer identifier (name, table, description) |
| status | text | NOT NULL, DEFAULT 'open', CHECK (status IN ('open', 'closed')) | Tab lifecycle state |
| created_at | timestamptz | NOT NULL, DEFAULT now() | When tab was opened |
| closed_at | timestamptz | NULL | When tab was closed |

**Indexes**:
- `idx_tabs_status` on (status) WHERE status = 'open' — Fast lookup of active tabs
- `idx_tabs_closed_at` on (closed_at) WHERE closed_at > now() - interval '24 hours' — Recently closed tabs

**RLS Policies**:
- All authenticated users can SELECT, INSERT, UPDATE tabs
- No DELETE allowed (soft close only)

---

### 2. orders

Represents a single order submission to the kitchen.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Unique identifier |
| tab_id | uuid | NOT NULL, FK → tabs(id) | Parent tab |
| status | text | NOT NULL, DEFAULT 'in_progress', CHECK (status IN ('in_progress', 'editing', 'complete')) | Order state |
| edited_by | uuid | NULL, FK → auth.users(id) | User currently editing (lock holder) |
| created_at | timestamptz | NOT NULL, DEFAULT now() | When order was submitted |
| completed_at | timestamptz | NULL | When kitchen marked complete |
| notes | text | NULL | Order-level notes |

**Indexes**:
- `idx_orders_tab` on (tab_id) — Order lookup by tab
- `idx_orders_status` on (status) WHERE status IN ('in_progress', 'editing') — Active orders for kitchen

**RLS Policies**:
- All authenticated users can SELECT, INSERT orders
- UPDATE restricted: cannot update if status = 'editing' AND edited_by != auth.uid()
- Cannot UPDATE if status = 'complete' (immutable once done)

**State Transitions**:
```
in_progress ──→ editing ──→ in_progress (edit confirmed)
     │                            │
     └──────→ complete ←──────────┘
```

---

### 3. order_items

Line items within an order.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Unique identifier |
| order_id | uuid | NOT NULL, FK → orders(id) ON DELETE CASCADE | Parent order |
| menu_item_id | uuid | NOT NULL, FK → menu_items(id) | Menu item ordered |
| quantity | integer | NOT NULL, CHECK (quantity > 0) | Number ordered |
| price_at_order | decimal(10,2) | NOT NULL | Price snapshot at order time |
| notes | text | NULL | Item-specific notes (e.g., "no onions") |

**Indexes**:
- `idx_order_items_order` on (order_id) — Items lookup by order

**RLS Policies**:
- Follows parent order access rules
- INSERT/UPDATE only when parent order status != 'complete'

---

### 4. menu_items

Products available for ordering.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Unique identifier |
| name | text | NOT NULL | Display name |
| price | decimal(10,2) | NOT NULL, CHECK (price >= 0) | Current price |
| category | text | NOT NULL | Grouping (e.g., "Food", "Drinks") |
| available | boolean | NOT NULL, DEFAULT true | Currently orderable |
| created_at | timestamptz | NOT NULL, DEFAULT now() | When added |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Last modified |

**Indexes**:
- `idx_menu_items_category` on (category) WHERE available = true — Menu display by category
- `idx_menu_items_available` on (available) WHERE available = true — Active items

**RLS Policies**:
- All authenticated users can SELECT
- INSERT/UPDATE restricted to admin role (out of scope for this feature)

---

## Computed Values

### Tab Total

Calculated via query, not stored:

```sql
SELECT COALESCE(SUM(oi.quantity * oi.price_at_order), 0) AS total
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.tab_id = $1;
```

### Order Elapsed Time

Calculated client-side from `orders.created_at`.

---

## Real-time Subscriptions

| Channel | Table | Events | Filter | Purpose |
|---------|-------|--------|--------|---------|
| kitchen-orders | orders | INSERT, UPDATE | status IN ('in_progress', 'editing') | Kitchen display updates |
| foh-ready | orders | UPDATE | status = 'complete' | Front of house ready notifications |
| order-items-{order_id} | order_items | INSERT, UPDATE, DELETE | order_id = specific | Edit mode item updates |

---

## Migration Notes

1. Enable Row Level Security on all tables
2. Create `authenticated` role policies
3. Enable Realtime for `orders` and `order_items` tables
4. Consider trigger to update `menu_items.updated_at` on changes
