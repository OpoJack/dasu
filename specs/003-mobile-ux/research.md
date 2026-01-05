# Research: Mobile UX & Tab Management

**Feature**: 003-mobile-ux
**Date**: 2026-01-04

## Research Tasks

### 1. Mobile Responsive Pattern for Three-Panel Layout

**Decision**: Use Tailwind's `md:` breakpoint (768px) to conditionally show/hide panels, with state-driven mobile view switching.

**Rationale**:
- Tailwind provides built-in responsive utilities - no additional dependencies
- State variable (`mobileView: 'tabs' | 'menu' | 'order'`) controls which panel is visible on mobile
- Desktop layout unchanged - panels remain visible via `hidden md:flex` / `md:hidden` classes

**Alternatives Considered**:
- CSS-only approach with media queries: Rejected - need state to control navigation
- React Portal for mobile overlay: Rejected - adds complexity, not needed
- Separate mobile component: Rejected - violates DRY, increases maintenance

### 2. Mobile Navigation Pattern

**Decision**: Bottom navigation bar with three tabs (Tabs, Menu, Order) visible only on mobile viewports.

**Rationale**:
- Bottom nav is the standard mobile pattern (iOS tab bar, Android bottom nav)
- Thumb-friendly for one-handed operation
- Clear visual indication of current section
- Badge on Order tab can show item count

**Alternatives Considered**:
- Hamburger menu: Rejected - adds extra tap, hides navigation
- Top tabs: Rejected - harder to reach with thumb on larger phones
- Swipe gestures only: Rejected - not discoverable, accessibility concerns

### 3. Sticky Footer Pattern

**Decision**: Use `flex-col` container with `flex-1 overflow-y-auto` for scrollable content and fixed footer for total.

**Rationale**:
- Pure CSS solution, no JavaScript scroll detection needed
- Works within existing flex layout structure
- Total remains visible without extra re-renders

**Implementation**:
```jsx
<div className="flex flex-col h-full">
  <div className="flex-1 overflow-y-auto">
    {/* Scrollable order list */}
  </div>
  <div className="border-t p-2 bg-background">
    {/* Sticky total + close button */}
  </div>
</div>
```

**Alternatives Considered**:
- `position: sticky`: Works but requires careful z-index management
- Intersection Observer: Over-engineered for this use case
- Fixed positioning: Breaks flex layout, requires padding compensation

### 4. Close Tab Confirmation Pattern

**Decision**: Use existing shadcn/ui `AlertDialog` component for confirmation.

**Rationale**:
- Already available in the project's component library
- Follows standard destructive action pattern (confirm before delete)
- Accessible (focus trap, keyboard navigation)

**Implementation Flow**:
1. User clicks "Close Tab"
2. Check for incomplete orders (status !== 'complete')
3. If incomplete orders exist, show warning in dialog
4. User confirms → call `close_tab` RPC → clear selection → refresh tabs

**Alternatives Considered**:
- Toast with undo: Doesn't meet FR-007 requirement for confirmation
- Inline confirmation: Less prominent, could be missed
- Custom modal: Unnecessary when AlertDialog exists

### 5. Tab Status Already Exists

**Decision**: Use existing database schema and RPC - no changes needed.

**Rationale**:
- `tabs.status` already has 'open' | 'closed' enum
- `tabs.closed_at` timestamp exists
- `close_tab(p_tab_id)` RPC already implemented
- Types in `database.ts` already support this

**No alternatives needed** - infrastructure is complete.

### 6. Mobile View State Management

**Decision**: Single `mobileView` state variable in FrontOfHouse component.

**Rationale**:
- Follows constitution principle IV (Colocate Logic With UI)
- Simple string enum: `'tabs' | 'menu' | 'order'`
- Auto-transition: selecting a tab switches to 'menu' view
- Order badge updates from existing `orderDraft.length`

**Alternatives Considered**:
- URL-based routing: Over-engineered for single page
- Context provider: Premature abstraction
- Local storage persistence: Not needed (refresh resets to tabs view is acceptable)

## Summary

All patterns use existing Tailwind utilities and shadcn/ui components. No new dependencies required. Implementation confined to FrontOfHouse.tsx with:
- State: `mobileView` for mobile navigation
- Layout: Conditional rendering with `md:` breakpoints
- Sticky total: Flex layout with overflow
- Close tab: AlertDialog with warning for incomplete orders
