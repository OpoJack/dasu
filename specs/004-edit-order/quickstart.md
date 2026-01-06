# Quickstart: Edit Order After Submission

**Feature**: 004-edit-order
**Date**: 2026-01-05

## Prerequisites

- Node.js 18+ installed
- npm or pnpm available
- Access to the project Supabase instance

## Setup

```bash
# 1. Switch to feature branch
git checkout 004-edit-order

# 2. Install dependencies (if needed)
npm install

# 3. Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## No Database Changes Required

This feature uses existing database infrastructure:
- `orders.status = 'editing'` already exists
- `start_order_edit()` and `finish_order_edit()` RPCs already exist
- No migrations needed

## Implementation Summary

All changes are in `src/pages/FrontOfHouse.tsx`:

1. **New State Variables**:
   - `editingOrderId: string | null` - tracks order being edited
   - `originalOrderItems: OrderDraftItem[]` - for cancel restoration

2. **New Functions**:
   - `startEdit(order)` - initiates edit mode
   - `saveEditedOrder()` - saves changes (vs creating new)
   - `cancelEdit()` - aborts edit and releases lock

3. **UI Changes**:
   - Edit button on in-progress orders in Tab Orders section
   - Submit button text changes to "Save Changes" when editing
   - Cancel button appears when editing
   - Mobile nav label: "Close Out" → "Orders"

## Testing the Feature

### Desktop Flow

1. Create a tab and submit an order
2. In Tab Orders section, click **Edit** on an in-progress order
3. Order items load into Current Order section
4. Add/remove items, change quantities
5. Click **Save Changes** to update
6. Open Kitchen view (`/#/kitchen`) to verify status changes

### Mobile Flow

1. Use browser dev tools to simulate mobile viewport
2. Navigate using bottom tabs: **Tabs** → **Menu** → **Orders**
3. In Orders view, tap **Edit** on an in-progress order
4. Modify and save as with desktop

### Kitchen Indicator

1. On one device: Start editing an order in Front of House
2. On another device (or tab): Open Kitchen view
3. Verify edited order shows yellow border and "BEING EDITED - HOLD"
4. Verify "Mark Complete" button is disabled
5. Save or cancel the edit
6. Verify kitchen display updates (yellow border removed)

## Key Files

| File | Changes |
|------|---------|
| `src/pages/FrontOfHouse.tsx` | Edit workflow implementation |
| `src/pages/Kitchen.tsx` | No changes (already handles editing status) |
| `src/types/database.ts` | No changes (types already exist) |

## Common Issues

### Edit button not appearing
- Check order status is `in_progress` (not `complete` or `editing`)
- Verify the order belongs to the selected tab

### "Cannot edit order" error
- Another user may be editing the order
- Order may have been completed while loading
- Check browser console for detailed error

### Kitchen not updating
- Verify Supabase real-time subscription is active
- Check browser console for subscription errors
- Try refreshing the kitchen view

## Next Steps

After implementation, run `/speckit.tasks` to generate the detailed task breakdown for implementation.
