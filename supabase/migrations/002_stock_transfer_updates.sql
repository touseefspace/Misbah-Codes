-- migration 002: Stock Transfer Updates
-- Drop existing multi-table structure if it exists
DROP TABLE IF EXISTS public.transfer_items CASCADE;
DROP TABLE IF EXISTS public.transfers CASCADE;

-- Ensure branches table has is_admin_branch
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branches' AND column_name='is_admin_branch') THEN
        ALTER TABLE public.branches ADD COLUMN is_admin_branch BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- Create unique index to ensure only one admin branch
-- Using (is_admin_branch) WHERE (is_admin_branch = true) to allow only one TRUE value
CREATE UNIQUE INDEX IF NOT EXISTS ux_branches_only_one_admin_branch ON public.branches (is_admin_branch) WHERE (is_admin_branch = true);

-- Create Transfers Table (Simplified Single Table)
CREATE TABLE public.transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    to_branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity DECIMAL(10,3) NOT NULL CHECK (quantity > 0),
    unit unit_type NOT NULL DEFAULT 'kg',
    status transfer_status NOT NULL DEFAULT 'pending',
    requested_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT from_to_branch_different CHECK (from_branch_id != to_branch_id)
);

-- Enable RLS
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- Policies for Transfers
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

-- Automated Inventory Update Trigger
CREATE OR REPLACE FUNCTION process_stock_transfer()
RETURNS TRIGGER AS $$
DECLARE
    v_kg_to_move DECIMAL(10,3);
    v_prod RECORD;
BEGIN
    -- Only trigger when status changes from pending to completed
    IF (NEW.status = 'completed' AND OLD.status = 'pending') THEN
        
        -- Get conversion factors from products
        SELECT kg_per_carton, kg_per_tray INTO v_prod FROM products WHERE id = NEW.product_id;

        -- Calculate weight in KG based on unit
        v_kg_to_move := CASE 
            WHEN NEW.unit = 'kg' THEN NEW.quantity
            WHEN NEW.unit = 'carton' THEN (NEW.quantity * COALESCE(v_prod.kg_per_carton, 1))
            WHEN NEW.unit = 'tray' THEN (NEW.quantity * COALESCE(v_prod.kg_per_tray, 1))
            ELSE NEW.quantity
        END;

        -- 1. Deduct from source branch
        UPDATE public.inventory 
        SET 
            quantity_kg = quantity_kg - v_kg_to_move,
            last_updated = NOW()
        WHERE branch_id = NEW.from_branch_id AND product_id = NEW.product_id;

        -- 2. Add to destination branch
        INSERT INTO public.inventory (branch_id, product_id, quantity_kg, last_updated)
        VALUES (NEW.to_branch_id, NEW.product_id, v_kg_to_move, NOW())
        ON CONFLICT (branch_id, product_id) 
        DO UPDATE SET 
            quantity_kg = public.inventory.quantity_kg + EXCLUDED.quantity_kg,
            last_updated = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create
DROP TRIGGER IF EXISTS tr_process_stock_transfer ON public.transfers;
CREATE TRIGGER tr_process_stock_transfer
AFTER UPDATE ON public.transfers
FOR EACH ROW
EXECUTE FUNCTION process_stock_transfer();
