-- Migration: 004_refactor_transfers.sql
-- Description: Refactor transfers to support multiple items per transfer request

-- 1. DROP existing single-table transfers structure (and data)
-- WARNING: This will delete existing transfer data. Ensure this is acceptable in dev.
DROP TABLE IF EXISTS public.transfers CASCADE;
DROP TABLE IF EXISTS public.transfer_items CASCADE;

-- 2. Create Transfers Table (Header)
CREATE TABLE public.transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    to_branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    status transfer_status NOT NULL DEFAULT 'pending',
    requested_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (from_branch_id != to_branch_id)
);

-- 3. Create Transfer Items Table (Lines)
CREATE TABLE public.transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    unit unit_type NOT NULL,
    quantity DECIMAL(10,3) NOT NULL CHECK (quantity > 0)
);

-- 4. Enable RLS
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Transfers
CREATE POLICY "Users can see relevant transfers"
ON public.transfers FOR SELECT
USING (
    is_admin() OR 
    requested_by = auth.uid()::text OR 
    from_branch_id = get_user_branch() OR 
    to_branch_id = get_user_branch()
);

CREATE POLICY "Salesmen can request transfers"
ON public.transfers FOR INSERT
WITH CHECK (
    to_branch_id = get_user_branch() AND
    status = 'pending'
);

CREATE POLICY "Admins can update transfers"
ON public.transfers FOR UPDATE
USING (is_admin());

-- 6. RLS Policies for Transfer Items
CREATE POLICY "Users can see items of visible transfers"
ON public.transfer_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.transfers t
        WHERE t.id = transfer_items.transfer_id
        AND (
            is_admin() OR 
            t.requested_by = auth.uid()::text OR 
            t.from_branch_id = get_user_branch() OR 
            t.to_branch_id = get_user_branch()
        )
    )
);

CREATE POLICY "Salesmen can add items to own pending transfers"
ON public.transfer_items FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.transfers t
        WHERE t.id = transfer_items.transfer_id
        AND t.requested_by = auth.uid()::text
        AND t.status = 'pending'
    )
);

-- 7. Automated Stock Movement Trigger (Multi-item support)
CREATE OR REPLACE FUNCTION process_transfer_completion()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    v_kg_to_move DECIMAL(10,3);
    v_prod RECORD;
BEGIN
    -- Only run when status changes to 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        
        -- Loop through all items in this transfer
        FOR item IN
            SELECT ti.product_id, ti.unit, ti.quantity
            FROM transfer_items ti
            WHERE ti.transfer_id = NEW.id
        LOOP
            -- Get conversion factors
            SELECT kg_per_carton, kg_per_tray INTO v_prod FROM products WHERE id = item.product_id;

            -- Calculate weight in KG
            v_kg_to_move := CASE 
                WHEN item.unit = 'kg' THEN item.quantity
                WHEN item.unit = 'carton' THEN (item.quantity * COALESCE(v_prod.kg_per_carton, 1))
                WHEN item.unit = 'tray' THEN (item.quantity * COALESCE(v_prod.kg_per_tray, 1))
                ELSE item.quantity
            END;

            -- 1. Deduct from source branch
            UPDATE public.inventory 
            SET 
                quantity_kg = quantity_kg - v_kg_to_move,
                last_updated = NOW()
            WHERE branch_id = NEW.from_branch_id AND product_id = item.product_id;

            -- 2. Add to destination branch
            INSERT INTO public.inventory (branch_id, product_id, quantity_kg, last_updated)
            VALUES (NEW.to_branch_id, item.product_id, v_kg_to_move, NOW())
            ON CONFLICT (branch_id, product_id) 
            DO UPDATE SET 
                quantity_kg = public.inventory.quantity_kg + EXCLUDED.quantity_kg,
                last_updated = NOW();
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach Trigger
DROP TRIGGER IF EXISTS tr_process_stock_transfer ON public.transfers;
CREATE TRIGGER tr_process_stock_transfer
AFTER UPDATE ON public.transfers
FOR EACH ROW
EXECUTE FUNCTION process_transfer_completion();

-- 8. Update get_dashboard_stats to work with new schema
CREATE OR REPLACE FUNCTION get_dashboard_stats(
    p_user_id TEXT,
    p_branch_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    stats JSON;
    user_role user_role;
BEGIN
    -- Get user role
    SELECT role INTO user_role FROM users WHERE id = p_user_id;
    
    -- Build stats
    SELECT json_build_object(
        'total_sales_today', (
            SELECT COALESCE(SUM(total_amount), 0)
            FROM transactions
            WHERE type = 'sale'
            AND DATE(created_at) = CURRENT_DATE
            AND (user_role = 'admin' OR (p_branch_id IS NOT NULL AND branch_id = p_branch_id))
        ),
        'total_purchases_today', (
            SELECT CASE 
                WHEN user_role = 'admin' THEN COALESCE(SUM(total_amount), 0)
                ELSE 0
            END
            FROM transactions
            WHERE type = 'purchase'
            AND DATE(created_at) = CURRENT_DATE
        ),
        'inventory_value', get_inventory_value(p_branch_id),
        'receivables', (
            SELECT COALESCE(SUM(balance), 0)
            FROM transactions t
            JOIN entities e ON t.entity_id = e.id
            WHERE e.type = 'customer'
            AND t.balance > 0
            AND (user_role = 'admin' OR (p_branch_id IS NOT NULL AND t.branch_id = p_branch_id))
        ),
        'payables', (
            SELECT CASE 
                WHEN user_role = 'admin' THEN COALESCE(SUM(balance), 0)
                ELSE 0
            END
            FROM transactions t
            JOIN entities e ON t.entity_id = e.id
            WHERE e.type = 'supplier'
            AND t.balance > 0
        ),
        'pending_transfers', (
            SELECT COUNT(*)
            FROM transfers
            WHERE status = 'pending'
            AND (
                user_role = 'admin' OR 
                (p_branch_id IS NOT NULL AND (to_branch_id = p_branch_id OR from_branch_id = p_branch_id))
            )
        )
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;
