/**
 * Bar Kitchen Order System - TypeScript Types
 * Branch: 001-bar-kitchen-orders
 * Date: 2026-01-03
 *
 * These types mirror the Supabase database schema.
 * In production, generate with: npx supabase gen types typescript
 */

// =============================================================================
// Database Types
// =============================================================================

export type TabStatus = 'open' | 'closed';
export type OrderStatus = 'in_progress' | 'editing' | 'complete';

export interface Tab {
  id: string;
  name: string;
  status: TabStatus;
  created_at: string;
  closed_at: string | null;
}

export interface Order {
  id: string;
  tab_id: string;
  status: OrderStatus;
  edited_by: string | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price_at_order: number;
  notes: string | null;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Joined/Enriched Types
// =============================================================================

/** Order item with menu item details */
export interface OrderItemWithMenuItem extends OrderItem {
  menu_item: MenuItem;
}

/** Order with its items */
export interface OrderWithItems extends Order {
  items: OrderItemWithMenuItem[];
}

/** Tab with all orders and items */
export interface TabWithOrders extends Tab {
  orders: OrderWithItems[];
  total: number;
}

/** Kitchen display order (minimal data for list view) */
export interface KitchenOrderSummary {
  id: string;
  tab_name: string;
  status: OrderStatus;
  item_count: number;
  notes: string | null;
  created_at: string;
  elapsed_seconds: number;
}

// =============================================================================
// Input Types (for mutations)
// =============================================================================

export interface CreateTabInput {
  name: string;
}

export interface CreateOrderInput {
  tab_id: string;
  notes?: string;
  items: CreateOrderItemInput[];
}

export interface CreateOrderItemInput {
  menu_item_id: string;
  quantity: number;
  notes?: string;
}

export interface UpdateOrderItemInput {
  id?: string; // Existing item ID (omit for new items)
  menu_item_id: string;
  quantity: number;
  notes?: string;
}

export interface EditOrderInput {
  notes?: string;
  items: UpdateOrderItemInput[];
}

// =============================================================================
// Realtime Payload Types
// =============================================================================

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimePayload<T> {
  eventType: RealtimeEvent;
  new: T | null;
  old: T | null;
}

export type OrderRealtimePayload = RealtimePayload<Order>;
export type OrderItemRealtimePayload = RealtimePayload<OrderItem>;

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  code?: string;
}

// Function return types
export type GetTabTotalResponse = number;
export type StartOrderEditResponse = boolean;
export type FinishOrderEditResponse = boolean;
export type CompleteOrderResponse = boolean;
export type CloseTabResponse = number; // Returns total
export type ReopenTabResponse = boolean;
