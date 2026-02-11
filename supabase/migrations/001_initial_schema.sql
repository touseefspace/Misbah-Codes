-- Misbah Fruits and Vegetables - Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Created: 2026-02-05

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'salesman', 'pending');
CREATE TYPE entity_type AS ENUM ('customer', 'supplier');
CREATE TYPE transaction_type AS ENUM ('sale', 'purchase');
CREATE TYPE payment_type AS ENUM ('debit', 'credit');
CREATE TYPE unit_type AS ENUM ('carton', 'tray', 'kg');
CREATE TYPE transfer_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users Table (synced from Clerk)
CREATE TABLE users (
    id TEXT PRIMARY KEY, -- Clerk user ID (e.g., user_...)
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'pending',
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    branch_id UUID, -- Foreign key added after branches table
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Branches Table
-- Branches Table
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    is_admin_branch BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Ensure only one branch can be marked as admin_branch.
-- Drop old constraint if present (safe / idempotent)
ALTER TABLE branches
  DROP CONSTRAINT IF EXISTS only_one_admin_branch;


-- Add foreign key to users table
ALTER TABLE users 
ADD CONSTRAINT users_branch_id_fkey 
FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;

-- Entities Table (Customers & Suppliers)
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type entity_type NOT NULL,
    phone TEXT,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    -- Cost prices (purchase price)
    cost_price_carton DECIMAL(10,2),
    cost_price_tray DECIMAL(10,2),
    cost_price_kg DECIMAL(10,2),
    -- Selling prices
    selling_price_carton DECIMAL(10,2),
    selling_price_tray DECIMAL(10,2),
    selling_price_kg DECIMAL(10,2),
    -- Conversion ratios
    kg_per_tray DECIMAL(10,3),
    tray_per_carton INTEGER,
    kg_per_carton DECIMAL(10,3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions Table (Sales & Purchases)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type transaction_type NOT NULL,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    balance DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    notes TEXT,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transaction Items Table
CREATE TABLE transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    unit unit_type NOT NULL,
    quantity DECIMAL(10,3) NOT NULL CHECK (quantity > 0),
    cost_price DECIMAL(10,2), -- For purchases and profit calculation
    selling_price DECIMAL(10,2), -- For sales
    amount DECIMAL(10,2) NOT NULL, -- quantity * price
    profit DECIMAL(10,2) -- For sales: (selling_price - cost_price) * quantity
);

-- Payments Table (Ledger entries)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    amount DECIMAL(10,2) NOT NULL,
    payment_type payment_type NOT NULL,
    balance_before DECIMAL(10,2),
    balance_after DECIMAL(10,2),
    notes TEXT,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inventory Table
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_carton DECIMAL(10,3) NOT NULL DEFAULT 0,
    quantity_tray DECIMAL(10,3) NOT NULL DEFAULT 0,
    quantity_kg DECIMAL(10,3) NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(branch_id, product_id)
);

-- Transfers Table
CREATE TABLE transfers (
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

-- Transfer Items Table
CREATE TABLE transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    unit unit_type NOT NULL,
    quantity DECIMAL(10,3) NOT NULL CHECK (quantity > 0)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Performance indexes
CREATE INDEX idx_transactions_entity_id ON transactions(entity_id);
CREATE INDEX idx_transactions_branch_id ON transactions(branch_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transaction_items_product_id ON transaction_items(product_id);
CREATE INDEX idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX idx_payments_entity_id ON payments(entity_id);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_inventory_branch_product ON inventory(branch_id, product_id);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_branch_id ON users(branch_id);
-- Preferred enforcement: unique expression index.
-- The expression yields 1 for admin rows and NULL otherwise; unique index
-- allows only one row to have value 1, therefore at most one admin branch.
CREATE UNIQUE INDEX ux_branches_only_one_admin_branch
  ON branches ((CASE WHEN is_admin_branch THEN 1 ELSE NULL END));


-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Get entity balance
CREATE OR REPLACE FUNCTION get_entity_balance(
    p_entity_id UUID,
    p_branch_id UUID DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
    total_balance DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(balance), 0)
    INTO total_balance
    FROM transactions
    WHERE entity_id = p_entity_id
    AND (p_branch_id IS NULL OR branch_id = p_branch_id);
    
    RETURN total_balance;
END;
$$ LANGUAGE plpgsql;

-- Get inventory value for a branch
CREATE OR REPLACE FUNCTION get_inventory_value(p_branch_id UUID DEFAULT NULL)
RETURNS DECIMAL AS $$
DECLARE
    total_value DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(
        (i.quantity_carton * p.cost_price_carton) +
        (i.quantity_tray * p.cost_price_tray) +
        (i.quantity_kg * p.cost_price_kg)
    ), 0)
    INTO total_value
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    WHERE p_branch_id IS NULL OR i.branch_id = p_branch_id;
    
    RETURN total_value;
END;
$$ LANGUAGE plpgsql;

-- Get dashboard statistics
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
    
    -- Build stats based on user role
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
            AND (user_role = 'admin' OR (p_branch_id IS NOT NULL AND to_branch_id = p_branch_id))
        )
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Update inventory on purchase
CREATE OR REPLACE FUNCTION update_inventory_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT type FROM transactions WHERE id = NEW.transaction_id) = 'purchase' THEN
        INSERT INTO inventory (branch_id, product_id, quantity_carton, quantity_tray, quantity_kg)
        SELECT 
            t.branch_id,
            NEW.product_id,
            CASE WHEN NEW.unit = 'carton' THEN NEW.quantity ELSE 0 END,
            CASE WHEN NEW.unit = 'tray' THEN NEW.quantity ELSE 0 END,
            CASE WHEN NEW.unit = 'kg' THEN NEW.quantity ELSE 0 END
        FROM transactions t
        WHERE t.id = NEW.transaction_id
        ON CONFLICT (branch_id, product_id) DO UPDATE
        SET 
            quantity_carton = inventory.quantity_carton + 
                CASE WHEN NEW.unit = 'carton' THEN NEW.quantity ELSE 0 END,
            quantity_tray = inventory.quantity_tray + 
                CASE WHEN NEW.unit = 'tray' THEN NEW.quantity ELSE 0 END,
            quantity_kg = inventory.quantity_kg + 
                CASE WHEN NEW.unit = 'kg' THEN NEW.quantity ELSE 0 END,
            last_updated = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update inventory on sale
CREATE OR REPLACE FUNCTION update_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT type FROM transactions WHERE id = NEW.transaction_id) = 'sale' THEN
        UPDATE inventory
        SET 
            quantity_carton = quantity_carton - 
                CASE WHEN NEW.unit = 'carton' THEN NEW.quantity ELSE 0 END,
            quantity_tray = quantity_tray - 
                CASE WHEN NEW.unit = 'tray' THEN NEW.quantity ELSE 0 END,
            quantity_kg = quantity_kg - 
                CASE WHEN NEW.unit = 'kg' THEN NEW.quantity ELSE 0 END,
            last_updated = NOW()
        WHERE branch_id = (SELECT branch_id FROM transactions WHERE id = NEW.transaction_id)
        AND product_id = NEW.product_id;
        
        -- Check if inventory went negative
        IF NOT FOUND OR EXISTS (
            SELECT 1 FROM inventory 
            WHERE branch_id = (SELECT branch_id FROM transactions WHERE id = NEW.transaction_id)
            AND product_id = NEW.product_id
            AND (quantity_carton < 0 OR quantity_tray < 0 OR quantity_kg < 0)
        ) THEN
            RAISE EXCEPTION 'Insufficient inventory for this sale';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calculate profit on sale
CREATE OR REPLACE FUNCTION calculate_profit_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT type FROM transactions WHERE id = NEW.transaction_id) = 'sale' THEN
        NEW.profit = (NEW.selling_price - NEW.cost_price) * NEW.quantity;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update transaction total amount
CREATE OR REPLACE FUNCTION update_transaction_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE transactions
    SET total_amount = (
        SELECT COALESCE(SUM(amount), 0)
        FROM transaction_items
        WHERE transaction_id = COALESCE(NEW.transaction_id, OLD.transaction_id)
    )
    WHERE id = COALESCE(NEW.transaction_id, OLD.transaction_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Process transfer completion
-- Replace process_transfer_completion with corrected version
CREATE OR REPLACE FUNCTION process_transfer_completion()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        FOR item IN
            SELECT ti.product_id, ti.unit, ti.quantity
            FROM transfer_items ti
            WHERE ti.transfer_id = NEW.id
        LOOP
            -- Decrease from source branch
            UPDATE inventory
            SET 
                quantity_carton = quantity_carton - 
                    CASE WHEN item.unit = 'carton' THEN item.quantity ELSE 0 END,
                quantity_tray = quantity_tray - 
                    CASE WHEN item.unit = 'tray' THEN item.quantity ELSE 0 END,
                quantity_kg = quantity_kg - 
                    CASE WHEN item.unit = 'kg' THEN item.quantity ELSE 0 END,
                last_updated = NOW()
            WHERE branch_id = NEW.from_branch_id AND product_id = item.product_id;
            
            -- Increase in destination branch
            INSERT INTO inventory (branch_id, product_id, quantity_carton, quantity_tray, quantity_kg)
            VALUES (
                NEW.to_branch_id,
                item.product_id,
                CASE WHEN item.unit = 'carton' THEN item.quantity ELSE 0 END,
                CASE WHEN item.unit = 'tray' THEN item.quantity ELSE 0 END,
                CASE WHEN item.unit = 'kg' THEN item.quantity ELSE 0 END
            )
            ON CONFLICT (branch_id, product_id) DO UPDATE
            SET 
                quantity_carton = inventory.quantity_carton + 
                    CASE WHEN item.unit = 'carton' THEN item.quantity ELSE 0 END,
                quantity_tray = inventory.quantity_tray + 
                    CASE WHEN item.unit = 'tray' THEN item.quantity ELSE 0 END,
                quantity_kg = inventory.quantity_kg + 
                    CASE WHEN item.unit = 'kg' THEN item.quantity ELSE 0 END,
                last_updated = NOW();
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Quick validation: show the function signature
SELECT proname, prosrc FROM pg_proc WHERE proname = 'process_transfer_completion';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON transfers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inventory management triggers
CREATE TRIGGER trigger_update_inventory_on_purchase
    AFTER INSERT ON transaction_items
    FOR EACH ROW EXECUTE FUNCTION update_inventory_on_purchase();

CREATE TRIGGER trigger_update_inventory_on_sale
    AFTER INSERT ON transaction_items
    FOR EACH ROW EXECUTE FUNCTION update_inventory_on_sale();

-- Profit calculation trigger
CREATE TRIGGER trigger_calculate_profit_on_sale
    BEFORE INSERT ON transaction_items
    FOR EACH ROW EXECUTE FUNCTION calculate_profit_on_sale();

-- Transaction total update triggers
CREATE TRIGGER trigger_update_transaction_total_insert
    AFTER INSERT ON transaction_items
    FOR EACH ROW EXECUTE FUNCTION update_transaction_total();

CREATE TRIGGER trigger_update_transaction_total_update
    AFTER UPDATE ON transaction_items
    FOR EACH ROW EXECUTE FUNCTION update_transaction_total();

CREATE TRIGGER trigger_update_transaction_total_delete
    AFTER DELETE ON transaction_items
    FOR EACH ROW EXECUTE FUNCTION update_transaction_total();

-- Transfer completion trigger
CREATE TRIGGER trigger_process_transfer_completion
    AFTER UPDATE ON transfers
    FOR EACH ROW EXECUTE FUNCTION process_transfer_completion();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_items ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text 
        AND role = 'admin' 
        AND is_approved = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user branch
CREATE OR REPLACE FUNCTION get_user_branch()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT branch_id FROM users WHERE id = auth.uid()::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get admin branch ID
CREATE OR REPLACE FUNCTION get_admin_branch_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM branches WHERE is_admin_branch = TRUE LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users RLS Policies
CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    TO authenticated
    USING (is_admin());

CREATE POLICY "Admins can update all users"
    ON users FOR UPDATE
    TO authenticated
    USING (is_admin());

CREATE POLICY "Users can view their own data"
    ON users FOR SELECT
    TO authenticated
    USING (id = auth.uid()::text);

-- Branches RLS Policies
CREATE POLICY "Anyone authenticated can view branches"
    ON branches FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "Only admins can manage branches"
    ON branches FOR ALL
    TO authenticated
    USING (is_admin());

-- Entities RLS Policies (Customers & Suppliers)
CREATE POLICY "Admins can view all entities"
    ON entities FOR SELECT
    TO authenticated
    USING (is_admin());

CREATE POLICY "Salesmen can view customers only"
    ON entities FOR SELECT
    TO authenticated
    USING (
        type = 'customer' AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'salesman' AND is_approved = TRUE)
    );

CREATE POLICY "Admins can manage all entities"
    ON entities FOR ALL
    TO authenticated
    USING (is_admin());

CREATE POLICY "Salesmen can create customers"
    ON entities FOR INSERT
    TO authenticated
    WITH CHECK (
        type = 'customer' AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'salesman' AND is_approved = TRUE)
    );

-- Products RLS Policies
CREATE POLICY "Anyone authenticated can view products"
    ON products FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "Only admins can manage products"
    ON products FOR ALL
    TO authenticated
    USING (is_admin());

-- Transactions RLS Policies
CREATE POLICY "Admins can view all transactions"
    ON transactions FOR SELECT
    TO authenticated
    USING (is_admin());

CREATE POLICY "Salesmen can view their branch sales"
    ON transactions FOR SELECT
    TO authenticated
    USING (
        type = 'sale' AND
        branch_id = get_user_branch() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'salesman' AND is_approved = TRUE)
    );

CREATE POLICY "Admins can manage all transactions"
    ON transactions FOR ALL
    TO authenticated
    USING (is_admin());

CREATE POLICY "Salesmen can create sales in their branch"
    ON transactions FOR INSERT
    TO authenticated
    WITH CHECK (
        type = 'sale' AND
        branch_id = get_user_branch() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'salesman' AND is_approved = TRUE)
    );

-- Transaction Items RLS Policies
CREATE POLICY "Users can view transaction items they can access"
    ON transaction_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM transactions
            WHERE transactions.id = transaction_items.transaction_id
        )
    );

CREATE POLICY "Admins can manage all transaction items"
    ON transaction_items FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM transactions
            WHERE transactions.id = transaction_items.transaction_id
            AND is_admin()
        )
    );

CREATE POLICY "Salesmen can create sale items for their transactions"
    ON transaction_items FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM transactions
            WHERE transactions.id = transaction_items.transaction_id
            AND transactions.type = 'sale'
            AND transactions.branch_id = get_user_branch()
        )
    );

-- Payments RLS Policies
CREATE POLICY "Admins can view all payments"
    ON payments FOR SELECT
    TO authenticated
    USING (is_admin());

CREATE POLICY "Salesmen can view their branch payments"
    ON payments FOR SELECT
    TO authenticated
    USING (
        branch_id = get_user_branch() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'salesman' AND is_approved = TRUE)
    );

CREATE POLICY "Admins can manage all payments"
    ON payments FOR ALL
    TO authenticated
    USING (is_admin());

CREATE POLICY "Salesmen can create payments in their branch"
    ON payments FOR INSERT
    TO authenticated
    WITH CHECK (
        branch_id = get_user_branch() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'salesman' AND is_approved = TRUE)
    );

-- Inventory RLS Policies
CREATE POLICY "Admins can view all inventory"
    ON inventory FOR SELECT
    TO authenticated
    USING (is_admin());

CREATE POLICY "Salesmen can view their branch and admin branch inventory"
    ON inventory FOR SELECT
    TO authenticated
    USING (
        (branch_id = get_user_branch() OR branch_id = get_admin_branch_id()) AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'salesman' AND is_approved = TRUE)
    );

CREATE POLICY "Only system can manage inventory"
    ON inventory FOR ALL
    TO authenticated
    USING (is_admin());

-- Transfers RLS Policies
CREATE POLICY "Admins can view all transfers"
    ON transfers FOR SELECT
    TO authenticated
    USING (is_admin());

CREATE POLICY "Salesmen can view their branch transfers"
    ON transfers FOR SELECT
    TO authenticated
    USING (
        (to_branch_id = get_user_branch() OR from_branch_id = get_user_branch()) AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'salesman' AND is_approved = TRUE)
    );

CREATE POLICY "Admins can manage all transfers"
    ON transfers FOR ALL
    TO authenticated
    USING (is_admin());

CREATE POLICY "Salesmen can request transfers to their branch"
    ON transfers FOR INSERT
    TO authenticated
    WITH CHECK (
        to_branch_id = get_user_branch() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'salesman' AND is_approved = TRUE)
    );

-- Transfer Items RLS Policies
CREATE POLICY "Users can view transfer items for accessible transfers"
    ON transfer_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM transfers
            WHERE transfers.id = transfer_items.transfer_id
        )
    );

CREATE POLICY "Admins can manage all transfer items"
    ON transfer_items FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM transfers
            WHERE transfers.id = transfer_items.transfer_id
            AND is_admin()
        )
    );

CREATE POLICY "Salesmen can create transfer items for their requests"
    ON transfer_items FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM transfers
            WHERE transfers.id = transfer_items.transfer_id
            AND transfers.to_branch_id = get_user_branch()
        )
    );

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Create admin branch
INSERT INTO branches (name, location, is_admin_branch)
VALUES ('Main Branch', 'Head Office', TRUE);

-- Note: First admin user must be created manually via Clerk and then approved in Supabase dashboard
-- Or created via the Clerk webhook when the first user signs up

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts synced from Clerk with role-based access control';
COMMENT ON TABLE branches IS 'Physical branch locations with one designated admin branch';
COMMENT ON TABLE entities IS 'Combined customers and suppliers table';
COMMENT ON TABLE products IS 'Product catalog with multi-unit pricing and conversions';
COMMENT ON TABLE transactions IS 'Sales and purchase transactions with line items';
COMMENT ON TABLE transaction_items IS 'Individual items in a transaction';
COMMENT ON TABLE payments IS 'Payment ledger entries with FIFO allocation';
COMMENT ON TABLE inventory IS 'Real-time stock levels per branch per product';
COMMENT ON TABLE transfers IS 'Inter-branch stock movement requests';
COMMENT ON TABLE transfer_items IS 'Items being transferred between branches';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
