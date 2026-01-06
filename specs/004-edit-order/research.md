# Research: Edit Order After Submission

**Feature**: 004-edit-order
**Date**: 2026-01-05
**Status**: Complete

## Executive Summary

Research confirms that all necessary infrastructure for order editing already exists in the codebase. The database schema includes an `editing` status, the Kitchen display already handles this status visually, and Supabase RPCs for starting/finishing edits are defined in the type system. Implementation requires only frontend changes to FrontOfHouse.tsx.

---

## Research Task 1: Existing Order Status Infrastructure

### Question
Does the database schema and existing code support an "editing" status for orders?

### Findings

**Database Schema** (`src/types/database.ts:70`):
```typescript
status: 'in_progress' | 'editing' | 'complete'
```
The `editing` status already exists in the orders table schema.

**Existing RPCs** (`src/types/database.ts:151-159`):
```typescript
start_order_edit: {
  Args: { p_order_id: string }
  Returns: boolean
}
finish_order_edit: {
  Args: { p_order_id: string }
  Returns: boolean
}
```
RPCs for managing edit state transitions exist and are typed.

**Kitchen Display** (`src/pages/Kitchen.tsx:74-98`):
- Already queries orders with status `in_progress` OR `editing`
- Already renders yellow border for editing orders (`border-yellow-500 border-2`)
- Already shows "BEING EDITED - HOLD" warning message
- Already disables "Mark Complete" button when `status === 'editing'`

### Decision
**Use existing infrastructure.** No database or RPC changes required. The Kitchen display is already complete—only FrontOfHouse needs frontend changes.

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Add new status like `pending_edit` | Unnecessary—`editing` already exists and works |
| Create new RPC for combined edit+update | Over-engineering—separate start/finish RPCs are cleaner |

---

## Research Task 2: Order Draft State Management

### Question
How should the edit state be managed in FrontOfHouse to support loading existing order items for modification?

### Findings

**Existing Order Draft State** (`src/pages/FrontOfHouse.tsx:72-74`):
```typescript
const [orderDraft, setOrderDraft] = useState<OrderDraftItem[]>([]);
const [orderNotes, setOrderNotes] = useState('');
const [submittingOrder, setSubmittingOrder] = useState(false);
```

**OrderDraftItem Type** (`src/pages/FrontOfHouse.tsx:41-45`):
```typescript
type OrderDraftItem = {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
};
```

**Current Submit Flow** (`src/pages/FrontOfHouse.tsx:284-341`):
- Creates new order in `orders` table
- Creates order_items with `price_at_order` snapshot
- Clears draft after success

### Decision
**Extend existing draft state with edit tracking.** Add:
- `editingOrderId: string | null` to track which order is being edited
- When saving, check if `editingOrderId` is set to determine create vs update flow
- Preserve original order items for cancel restoration

### Implementation Approach
```typescript
// New state
const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
const [originalOrderItems, setOriginalOrderItems] = useState<OrderDraftItem[]>([]);

// Edit initiation
async function startEdit(order: OrderWithDetails) {
  const { data: success } = await supabase.rpc('start_order_edit', { p_order_id: order.id });
  if (success) {
    setEditingOrderId(order.id);
    setOriginalOrderItems([...orderDraft]); // For cancel restoration
    setOrderDraft(order.order_items.map(item => ({
      menuItem: item.menu_item,
      quantity: item.quantity,
      notes: item.notes || ''
    })));
    setOrderNotes(order.notes || '');
  }
}
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Create separate edit state/component | Violates constitution IV (colocate logic with UI) |
| Use React Context for edit state | Over-abstraction for single-component use |
| Optimistic UI updates | Risk of inconsistent state—safer to wait for RPC confirmation |

---

## Research Task 3: Order Item Update Strategy

### Question
How should order items be updated when saving an edited order?

### Findings

**Current Order Items Table** (`src/types/database.ts:103-127`):
- `order_id`: links to parent order
- `menu_item_id`: links to menu item
- `quantity`: count of items
- `price_at_order`: price snapshot at order time
- `notes`: optional item-specific notes

**Challenge**: Items may be added, removed, or modified during edit. Options:
1. Delete all existing items and re-insert
2. Diff existing vs new items and apply changes
3. Soft-delete pattern (add `deleted` flag)

### Decision
**Delete-and-recreate approach.** For simplicity (constitution I), delete all order_items for the order, then insert the new set. This avoids complex diffing logic and handles all cases (add/remove/modify) uniformly.

### Implementation Approach
```typescript
async function saveEditedOrder() {
  // 1. Delete existing order_items
  await supabase
    .from('order_items')
    .delete()
    .eq('order_id', editingOrderId);

  // 2. Insert new order_items
  const orderItems = orderDraft.map(d => ({
    order_id: editingOrderId,
    menu_item_id: d.menuItem.id,
    quantity: d.quantity,
    price_at_order: d.menuItem.price, // Re-snapshot current price
    notes: d.notes.trim() || null,
  }));
  await supabase.from('order_items').insert(orderItems);

  // 3. Update order notes and finish edit
  await supabase
    .from('orders')
    .update({ notes: orderNotes.trim() || null })
    .eq('id', editingOrderId);

  await supabase.rpc('finish_order_edit', { p_order_id: editingOrderId });
}
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Diff-and-patch items | Complex logic for marginal benefit; delete-recreate is simpler |
| Soft delete items | Adds schema complexity; not needed for single-night app |
| Keep original prices | Ambiguous UX—user expects current prices after edit |

**Note on Pricing**: When editing, `price_at_order` will be re-snapshotted to current menu prices. This is intentional—if prices change between original order and edit, the edited order reflects current pricing. For a single-night bar app, prices rarely change mid-service.

---

## Research Task 4: Real-time Kitchen Updates

### Question
Will the kitchen display automatically update when order items change during an edit?

### Findings

**Kitchen Subscription** (`src/pages/Kitchen.tsx:41-57`):
```typescript
const channel = supabase
  .channel('kitchen-orders')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => {
      if (payload.eventType === 'INSERT') {
        playAlert();
        loadOrders();
      } else if (payload.eventType === 'UPDATE') {
        loadOrders();
      }
    }
  )
```

The kitchen subscribes to `orders` table changes only, not `order_items`. When `finish_order_edit` is called:
1. Order status changes from `editing` back to `in_progress`
2. This triggers an UPDATE event
3. Kitchen reloads all orders, which fetches updated order_items

### Decision
**Existing subscription is sufficient.** The `loadOrders()` call fetches full order details including items. FR-014 (real-time item updates) is satisfied by the existing architecture—no changes needed.

### Edge Case: Intermediate Updates
If the user wants kitchen to see item changes *while* editing (not just after save), we would need to subscribe to `order_items` too. However, the spec says "when saved, the kitchen display should update"—the existing behavior is correct.

---

## Research Task 5: Mobile Navigation Rename

### Question
How is the mobile navigation currently implemented, and what changes are needed?

### Findings

**Mobile Navigation** (`src/pages/FrontOfHouse.tsx:1041-1075`):
```tsx
<button onClick={() => setMobileView('closeout')}>
  Close out
</button>
```

The navigation is a simple state toggle with hardcoded labels.

### Decision
**Simple label change.** Rename `closeout` state value to `orders` for consistency, and change the button label from "Close out" to "Orders".

### Implementation
```tsx
// State change
const [mobileView, setMobileView] = useState<'tabs' | 'menu' | 'orders'>('tabs');

// Label change (line 1071)
<button onClick={() => setMobileView('orders')}>
  Orders
</button>
```

---

## Summary of Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Database/RPC changes | None needed | Existing `editing` status and RPCs sufficient |
| Kitchen display changes | None needed | Already handles `editing` status correctly |
| Edit state management | Extend `orderDraft` with `editingOrderId` | Reuses existing draft pattern |
| Order item updates | Delete-and-recreate | Simplest approach per constitution I |
| Real-time updates | Use existing subscription | `orders` table subscription triggers full reload |
| Mobile nav rename | Simple label change | `closeout` → `orders` |

## Open Questions

None. All technical decisions are resolved. Ready for Phase 1 design artifacts.
