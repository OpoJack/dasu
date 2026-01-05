# Quickstart: Mobile UX & Tab Management

**Feature**: 003-mobile-ux
**Date**: 2026-01-04

## Prerequisites

- Completed features 001-bar-kitchen-orders and 002-order-status-visibility
- Working FOH and Kitchen displays
- Existing `close_tab` RPC in Supabase

## What This Feature Adds

This is a **UI-only enhancement** - no database changes required.

### Mobile Responsiveness
1. Single-column layout on viewports < 768px
2. Bottom navigation bar to switch between Tabs, Menu, and Order views
3. Full functionality preserved in mobile view

### Sticky Total
1. Tab Orders section shows grand total fixed at bottom
2. Orders scroll independently while total remains visible

### Close Tab
1. "Close Tab" button in Tab Orders section
2. Confirmation dialog with warning for incomplete orders
3. Uses existing `close_tab` Supabase RPC

## Implementation Steps

### Step 1: Add Mobile View State

Add state to FrontOfHouse.tsx:

```typescript
// Mobile navigation state
const [mobileView, setMobileView] = useState<'tabs' | 'menu' | 'order'>('tabs')
```

### Step 2: Add Bottom Navigation (Mobile Only)

Add a bottom nav bar that only shows on mobile:

```tsx
{/* Bottom Navigation - Mobile Only */}
<nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background">
  <div className="flex">
    <button onClick={() => setMobileView('tabs')} className={...}>
      Tabs
    </button>
    <button onClick={() => setMobileView('menu')} className={...}>
      Menu
    </button>
    <button onClick={() => setMobileView('order')} className={...}>
      Order {orderDraft.length > 0 && `(${orderDraft.length})`}
    </button>
  </div>
</nav>
```

### Step 3: Conditional Panel Rendering

Wrap each panel with mobile visibility logic:

```tsx
{/* Tabs Panel */}
<div className={`
  ${mobileView === 'tabs' ? 'flex' : 'hidden'}
  md:flex
  w-full md:w-64
  ...
`}>

{/* Menu Panel */}
<div className={`
  ${mobileView === 'menu' ? 'flex' : 'hidden'}
  md:flex
  flex-1
  ...
`}>

{/* Order Panel */}
<div className={`
  ${mobileView === 'order' ? 'flex' : 'hidden'}
  md:flex
  w-full md:w-80
  ...
`}>
```

### Step 4: Auto-Navigate on Tab Selection

When user selects a tab on mobile, switch to menu view:

```typescript
function selectTab(tab: TabWithOrders) {
  setSelectedTab(tab)
  // ... existing acknowledgement logic ...

  // On mobile, switch to menu view after selecting tab
  setMobileView('menu')
}
```

### Step 5: Sticky Total in Tab Orders

Restructure Tab Orders section:

```tsx
<div className="h-1/3 flex flex-col bg-muted/30">
  <h2 className="p-4 pb-2 font-semibold">Tab Orders</h2>

  {/* Scrollable orders */}
  <div className="flex-1 overflow-y-auto px-4">
    {/* Order cards here */}
  </div>

  {/* Sticky footer with total + close button */}
  <div className="border-t p-4 bg-background">
    <div className="flex justify-between font-bold">
      <span>Total</span>
      <span>${total.toFixed(2)}</span>
    </div>
    <Button variant="destructive" className="w-full mt-2">
      Close Tab
    </Button>
  </div>
</div>
```

### Step 6: Close Tab with Confirmation

Add AlertDialog for confirmation:

```tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, ... } from '@/components/ui/alert-dialog'

// State
const [showCloseConfirm, setShowCloseConfirm] = useState(false)

// Check for incomplete orders
const hasIncompleteOrders = selectedTab?.orders.some(o => o.status !== 'complete')

// Close handler
async function closeTab() {
  if (!selectedTab) return

  const { error } = await supabase.rpc('close_tab', { p_tab_id: selectedTab.id })

  if (error) {
    toast({ title: 'Error closing tab', description: error.message, variant: 'destructive' })
    return
  }

  setSelectedTab(null)
  setShowCloseConfirm(false)
  loadTabs()
  toast({ title: 'Tab closed' })
}
```

## Verification

### Test Mobile Layout
1. Open browser DevTools, set viewport to 375px wide
2. Verify only one section visible at a time
3. Tap through bottom nav to switch sections
4. Select a tab → should auto-switch to Menu view

### Test Sticky Total
1. Select a tab with 5+ orders
2. Scroll through orders
3. Verify total stays visible at bottom

### Test Close Tab
1. Select a tab with all orders complete
2. Click "Close Tab" → confirm → tab removed
3. Select a tab with incomplete orders
4. Click "Close Tab" → see warning message → confirm → tab removed

## Troubleshooting

### Bottom nav not visible?
- Check `md:hidden` class is applied
- Verify no parent has `overflow: hidden` cutting it off

### Panels not switching on mobile?
- Check `mobileView` state is updating
- Verify conditional classes are correct

### Total not sticky?
- Ensure parent has `flex flex-col` and defined height
- Check scrollable area has `flex-1 overflow-y-auto`
