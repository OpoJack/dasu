# Supabase RPC Contracts: Edit Order

**Feature**: 004-edit-order
**Date**: 2026-01-05

## Overview

This feature uses **existing** Supabase RPCs. No new RPCs need to be created. This document specifies the contract for each RPC used in the edit workflow.

---

## RPC: start_order_edit

**Purpose**: Transition an order from `in_progress` to `editing` status, acquiring an edit lock.

### Signature

```sql
start_order_edit(p_order_id: uuid) → boolean
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| p_order_id | uuid | Yes | ID of the order to edit |

### Returns

| Type | Description |
|------|-------------|
| boolean | `true` if edit lock acquired, `false` if order not editable (wrong status or already being edited) |

### Preconditions

- Order exists with given ID
- Order status is `in_progress`
- Order is not already being edited by another user

### Postconditions (on success)

- Order status is `editing`
- Order `edited_by` may be set (implementation dependent)

### Error Cases

| Condition | Return Value | Client Handling |
|-----------|--------------|-----------------|
| Order not found | `false` | Show error toast |
| Order status is `complete` | `false` | Show "Order already completed" toast |
| Order status is `editing` | `false` | Show "Order is being edited by someone else" toast |

### Example Usage

```typescript
const { data: success, error } = await supabase.rpc('start_order_edit', {
  p_order_id: orderId,
});

if (error) {
  toast({ title: 'Error starting edit', description: error.message, variant: 'destructive' });
  return;
}

if (!success) {
  toast({ title: 'Cannot edit order', description: 'Order may have been completed or is being edited', variant: 'destructive' });
  return;
}

// Proceed with loading order into edit mode
```

---

## RPC: finish_order_edit

**Purpose**: Transition an order from `editing` back to `in_progress` status, releasing the edit lock.

### Signature

```sql
finish_order_edit(p_order_id: uuid) → boolean
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| p_order_id | uuid | Yes | ID of the order to finish editing |

### Returns

| Type | Description |
|------|-------------|
| boolean | `true` if edit lock released, `false` if order not in editing state |

### Preconditions

- Order exists with given ID
- Order status is `editing`

### Postconditions (on success)

- Order status is `in_progress`
- Order `edited_by` is cleared (if set)

### Error Cases

| Condition | Return Value | Client Handling |
|-----------|--------------|-----------------|
| Order not found | `false` | Log error, continue cleanup |
| Order status is not `editing` | `false` | Log warning, consider already released |

### Example Usage

```typescript
// Called after saving order items, or on cancel
const { data: success, error } = await supabase.rpc('finish_order_edit', {
  p_order_id: editingOrderId,
});

if (error) {
  toast({ title: 'Error finishing edit', description: error.message, variant: 'destructive' });
  // Continue with cleanup anyway
}

// Clear edit state regardless of result
setEditingOrderId(null);
setOrderDraft([]);
```

---

## Table Operations: order_items

### Delete Order Items

**Purpose**: Remove all existing items from an order before recreating with updated items.

```typescript
await supabase
  .from('order_items')
  .delete()
  .eq('order_id', orderId);
```

### Insert Order Items

**Purpose**: Add new/updated items to an order.

```typescript
const items = orderDraft.map(d => ({
  order_id: orderId,
  menu_item_id: d.menuItem.id,
  quantity: d.quantity,
  price_at_order: d.menuItem.price,
  notes: d.notes.trim() || null,
}));

await supabase.from('order_items').insert(items);
```

### Validation

| Field | Constraint | Client Responsibility |
|-------|------------|----------------------|
| order_id | Must exist | Verify editingOrderId is set |
| menu_item_id | Must exist | Use items from loaded menu |
| quantity | ≥ 1 | Client-side validation |
| price_at_order | > 0 | Use current menu item price |

---

## Table Operations: orders

### Update Order Notes

**Purpose**: Update order-level notes during edit save.

```typescript
await supabase
  .from('orders')
  .update({ notes: orderNotes.trim() || null })
  .eq('id', orderId);
```

---

## Complete Edit Save Flow

```typescript
async function saveEditedOrder() {
  if (!editingOrderId || orderDraft.length === 0) return;

  setSubmittingOrder(true);

  try {
    // 1. Delete existing items
    const { error: deleteError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', editingOrderId);

    if (deleteError) throw deleteError;

    // 2. Insert new items
    const orderItems = orderDraft.map(d => ({
      order_id: editingOrderId,
      menu_item_id: d.menuItem.id,
      quantity: d.quantity,
      price_at_order: d.menuItem.price,
      notes: d.notes.trim() || null,
    }));

    const { error: insertError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (insertError) throw insertError;

    // 3. Update order notes
    const { error: updateError } = await supabase
      .from('orders')
      .update({ notes: orderNotes.trim() || null })
      .eq('id', editingOrderId);

    if (updateError) throw updateError;

    // 4. Release edit lock
    const { error: finishError } = await supabase.rpc('finish_order_edit', {
      p_order_id: editingOrderId,
    });

    if (finishError) throw finishError;

    // 5. Clear state and reload
    setEditingOrderId(null);
    setOrderDraft([]);
    setOrderNotes('');
    loadTabs();

    toast({ title: 'Order updated!' });

  } catch (err) {
    toast({
      title: 'Error saving order',
      description: err instanceof Error ? err.message : 'Unknown error',
      variant: 'destructive',
    });
  } finally {
    setSubmittingOrder(false);
  }
}
```

---

## Cancel Edit Flow

```typescript
async function cancelEdit() {
  if (!editingOrderId) return;

  // Release edit lock
  await supabase.rpc('finish_order_edit', {
    p_order_id: editingOrderId,
  });

  // Restore original state (if preserved) or just clear
  setEditingOrderId(null);
  setOrderDraft([]);
  setOrderNotes('');
  loadTabs();

  toast({ title: 'Edit cancelled' });
}
```
