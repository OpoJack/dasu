# Research: Bar Kitchen Order System

**Branch**: `001-bar-kitchen-orders` | **Date**: 2026-01-03

## Overview

Research findings for implementing a real-time bar kitchen order system using React + Supabase.

---

## 1. Supabase Real-time Subscriptions

**Decision**: Use Supabase Realtime with Postgres Changes for order updates

**Rationale**:
- Native integration with Supabase JS client—no additional infrastructure
- Postgres Changes broadcasts INSERT/UPDATE/DELETE on tables
- Supports filtering by table, event type, and column values
- Low latency (<100ms typical) meets the 2-second requirement easily
- Automatic reconnection handling built into the client

**Implementation Pattern**:
```typescript
// Subscribe to order changes for kitchen display
const channel = supabase
  .channel('orders')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => handleOrderChange(payload)
  )
  .subscribe()
```

**Alternatives Considered**:
- **Polling**: Rejected—adds latency, wastes resources, doesn't scale
- **WebSockets (custom)**: Rejected—unnecessary when Supabase provides this
- **Server-Sent Events**: Rejected—Supabase Realtime is more feature-complete

---

## 2. Audio Alerts in Kitchen Environment

**Decision**: Use Web Audio API with user-triggered audio context initialization

**Rationale**:
- Modern browsers require user interaction before playing audio (autoplay policy)
- Kitchen display should have a "start shift" or initial interaction to enable audio
- Web Audio API allows volume control and can handle 70+ dB playback (hardware dependent)
- Pre-load audio files on page load for instant playback

**Implementation Pattern**:
```typescript
// Initialize on first user interaction
let audioContext: AudioContext | null = null;

export const initAudio = () => {
  audioContext = new AudioContext();
  // Pre-load alert sound
};

export const playAlert = async () => {
  if (!audioContext) return;
  // Play pre-loaded sound
};
```

**Alternatives Considered**:
- **HTML5 Audio element**: Simpler but less control over timing and volume
- **Third-party audio libraries**: Unnecessary complexity for simple alert sounds

---

## 3. Optimistic Updates with Conflict Handling

**Decision**: Use optimistic UI updates with server reconciliation for order edits

**Rationale**:
- Provides instant feedback for front of house staff
- Supabase returns the actual server state after mutation
- Real-time subscription handles conflict detection (another user editing)
- Roll back optimistic update if server rejects (e.g., order already complete)

**Implementation Pattern**:
```typescript
// Optimistic update pattern
const editOrder = async (orderId: string, updates: Partial<Order>) => {
  // 1. Optimistically update local state
  setOrders(prev => prev.map(o => o.id === orderId ? {...o, ...updates, status: 'editing'} : o));

  // 2. Send to server
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select();

  // 3. Reconcile (realtime will also broadcast to other clients)
  if (error) {
    // Roll back - refetch actual state
  }
};
```

**Alternatives Considered**:
- **Server-only updates**: Rejected—too slow for bar service environment
- **Full offline-first**: Overkill for this use case; simple queue sufficient

---

## 4. Concurrent Edit Prevention (Pessimistic Locking)

**Decision**: Use row-level status field + database constraint for edit locks

**Rationale**:
- Order status includes "editing" state that acts as a soft lock
- RLS policy or trigger can prevent updates when status = 'editing' and editor != current user
- Simple to implement without additional tables
- Kitchen sees "being edited" flag immediately via real-time subscription

**Implementation Pattern**:
```sql
-- Add edited_by column to orders table
ALTER TABLE orders ADD COLUMN edited_by uuid REFERENCES auth.users(id);

-- RLS policy to prevent concurrent edits
CREATE POLICY "prevent_concurrent_edits" ON orders
FOR UPDATE USING (
  status != 'editing' OR edited_by = auth.uid()
);
```

**Alternatives Considered**:
- **Separate locks table**: More complex, unnecessary for this scale
- **Application-level locking**: Race conditions without DB enforcement
- **Last-write-wins**: Rejected—would cause confusion in kitchen

---

## 5. Offline Order Queuing

**Decision**: Queue orders in localStorage when offline, sync on reconnect

**Rationale**:
- Network drops happen in busy bar environments
- Staff shouldn't lose orders if connection briefly drops
- Supabase client provides connection state events
- Simple queue pattern: store pending orders, retry on reconnect

**Implementation Pattern**:
```typescript
// On submit when offline
if (!navigator.onLine || !supabaseConnected) {
  const queue = JSON.parse(localStorage.getItem('orderQueue') || '[]');
  queue.push({ order, timestamp: Date.now() });
  localStorage.setItem('orderQueue', JSON.stringify(queue));
  showOfflineIndicator();
}

// On reconnect
supabase.channel('system').on('system', { event: 'connected' }, () => {
  syncOfflineQueue();
});
```

**Alternatives Considered**:
- **IndexedDB**: More robust but overkill for simple order queue
- **Service Worker + Background Sync**: More complex, harder to debug
- **No offline support**: Rejected—would frustrate staff during service

---

## 6. Price Snapshot Strategy

**Decision**: Store item price at order time in order_items table

**Rationale**:
- User already specified: "Items already ordered retain their original price"
- Capture price in `order_items.price_at_order` column
- Tab total calculated from order_items, not current menu_items prices
- Allows menu price changes without affecting open tabs

**Implementation Pattern**:
```sql
-- order_items table includes price snapshot
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  menu_item_id uuid REFERENCES menu_items(id),
  quantity integer NOT NULL,
  price_at_order decimal(10,2) NOT NULL, -- Snapshot
  notes text
);

-- Tab total query
SELECT SUM(quantity * price_at_order) FROM order_items
WHERE order_id IN (SELECT id FROM orders WHERE tab_id = $1);
```

**Alternatives Considered**:
- **Store only menu_item_id, lookup current price**: Rejected—violates requirement
- **Versioned menu_items**: Overkill for this use case

---

## 7. Elapsed Time Display

**Decision**: Calculate elapsed time client-side from order.created_at timestamp

**Rationale**:
- Database stores UTC timestamp when order submitted
- Client calculates and displays "X minutes ago" dynamically
- Update display every 15-30 seconds (setInterval)
- No server round-trips needed for time updates

**Implementation Pattern**:
```typescript
const formatElapsed = (createdAt: string): string => {
  const seconds = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
};

// Update every 30 seconds
useEffect(() => {
  const interval = setInterval(() => setNow(Date.now()), 30000);
  return () => clearInterval(interval);
}, []);
```

**Alternatives Considered**:
- **Server-calculated elapsed time**: Unnecessary network overhead
- **Real-time elapsed via subscription**: Overkill, client-side is simpler

---

## 8. Kitchen Display Layout for 15+ Orders

**Decision**: Grid layout with scrolling, orders sorted by elapsed time (oldest first)

**Rationale**:
- SC-004 requires viewing 15 orders at a glance without scrolling
- Grid layout (3-4 columns) maximizes screen real estate
- Compact order cards: identifier, items count, elapsed time, status indicator
- Oldest orders float to top-left (most urgent)
- Expand on tap for full details

**Implementation Pattern**:
```css
.kitchen-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  max-height: 100vh;
  overflow-y: auto;
}

.order-card {
  /* Compact view: ~150-200px height */
}
```

**Alternatives Considered**:
- **Single column list**: Doesn't fit 15 orders on screen
- **Kanban-style lanes**: More complex, not needed for single status flow

---

## Summary

All technical decisions resolved. No NEEDS CLARIFICATION items remain. The architecture leverages Supabase's built-in capabilities (real-time, auth, RLS) to minimize custom code while meeting all functional requirements.

| Area | Decision | Key Benefit |
|------|----------|-------------|
| Real-time | Supabase Postgres Changes | Native, low-latency, auto-reconnect |
| Audio | Web Audio API + user init | Browser-compatible, instant playback |
| Edits | Optimistic UI + reconciliation | Fast feedback, conflict resolution |
| Locking | Status field + RLS policy | Prevents concurrent edits at DB level |
| Offline | localStorage queue | Resilience during network drops |
| Pricing | Snapshot in order_items | Preserves prices for open tabs |
| Elapsed | Client-side calculation | No server overhead |
| Layout | Grid, 15+ orders visible | Meets SC-004 requirement |
