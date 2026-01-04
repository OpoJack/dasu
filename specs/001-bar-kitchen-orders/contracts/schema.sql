-- Bar Kitchen Order System - Supabase Schema
-- Branch: 001-bar-kitchen-orders
-- Date: 2026-01-03

-- =============================================================================
-- TABLES
-- =============================================================================

-- Menu Items (products available for ordering)
CREATE TABLE menu_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    price decimal(10,2) NOT NULL CHECK (price >= 0),
    category text NOT NULL,
    available boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabs (customer sessions)
CREATE TABLE tabs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at timestamptz NOT NULL DEFAULT now(),
    closed_at timestamptz
);

-- Orders (submissions to kitchen)
CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tab_id uuid NOT NULL REFERENCES tabs(id),
    status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'editing', 'complete')),
    edited_by uuid REFERENCES auth.users(id),
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz
);

-- Order Items (line items within an order)
CREATE TABLE order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id uuid NOT NULL REFERENCES menu_items(id),
    quantity integer NOT NULL CHECK (quantity > 0),
    price_at_order decimal(10,2) NOT NULL,
    notes text
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Tabs
CREATE INDEX idx_tabs_status ON tabs(status) WHERE status = 'open';
CREATE INDEX idx_tabs_closed_at ON tabs(closed_at);

-- Orders
CREATE INDEX idx_orders_tab ON orders(tab_id);
CREATE INDEX idx_orders_active ON orders(status)
    WHERE status IN ('in_progress', 'editing');

-- Order Items
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Menu Items
CREATE INDEX idx_menu_items_category ON menu_items(category) WHERE available = true;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Menu Items: All authenticated users can read and insert
CREATE POLICY "menu_items_select" ON menu_items
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "menu_items_insert" ON menu_items
    FOR INSERT TO authenticated WITH CHECK (true);

-- Tabs: All authenticated users can manage
CREATE POLICY "tabs_select" ON tabs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "tabs_insert" ON tabs
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "tabs_update" ON tabs
    FOR UPDATE TO authenticated USING (true);

-- Orders: Select and insert for all authenticated
CREATE POLICY "orders_select" ON orders
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "orders_insert" ON orders
    FOR INSERT TO authenticated WITH CHECK (true);

-- Orders: Update with concurrent edit protection
CREATE POLICY "orders_update" ON orders
    FOR UPDATE TO authenticated USING (
        -- Cannot update completed orders
        status != 'complete'
        AND (
            -- Can update if not being edited, or if you're the editor
            status != 'editing' OR edited_by = auth.uid()
        )
    );

-- Order Items: Follow parent order access
CREATE POLICY "order_items_select" ON order_items
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "order_items_insert" ON order_items
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_id AND o.status != 'complete'
        )
    );

CREATE POLICY "order_items_update" ON order_items
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_id AND o.status != 'complete'
        )
    );

CREATE POLICY "order_items_delete" ON order_items
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_id AND o.status != 'complete'
        )
    );

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Get tab total
CREATE OR REPLACE FUNCTION get_tab_total(p_tab_id uuid)
RETURNS decimal(10,2)
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(SUM(oi.quantity * oi.price_at_order), 0)
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.tab_id = p_tab_id;
$$;

-- Start editing an order (acquire lock)
CREATE OR REPLACE FUNCTION start_order_edit(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE orders
    SET status = 'editing', edited_by = auth.uid()
    WHERE id = p_order_id
      AND status = 'in_progress';

    RETURN FOUND;
END;
$$;

-- Finish editing an order (release lock)
CREATE OR REPLACE FUNCTION finish_order_edit(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE orders
    SET status = 'in_progress', edited_by = NULL
    WHERE id = p_order_id
      AND status = 'editing'
      AND edited_by = auth.uid();

    RETURN FOUND;
END;
$$;

-- Mark order complete
CREATE OR REPLACE FUNCTION complete_order(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE orders
    SET status = 'complete', completed_at = now(), edited_by = NULL
    WHERE id = p_order_id
      AND status IN ('in_progress', 'editing');

    RETURN FOUND;
END;
$$;

-- Close tab
CREATE OR REPLACE FUNCTION close_tab(p_tab_id uuid)
RETURNS decimal(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total decimal(10,2);
BEGIN
    -- Get total before closing
    SELECT get_tab_total(p_tab_id) INTO v_total;

    -- Close the tab
    UPDATE tabs
    SET status = 'closed', closed_at = now()
    WHERE id = p_tab_id
      AND status = 'open';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tab not found or already closed';
    END IF;

    RETURN v_total;
END;
$$;

-- Reopen recently closed tab
CREATE OR REPLACE FUNCTION reopen_tab(p_tab_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE tabs
    SET status = 'open', closed_at = NULL
    WHERE id = p_tab_id
      AND status = 'closed'
      AND closed_at > now() - interval '24 hours';

    RETURN FOUND;
END;
$$;

-- =============================================================================
-- REALTIME
-- =============================================================================

-- Enable realtime for orders and order_items
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update menu_items.updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
