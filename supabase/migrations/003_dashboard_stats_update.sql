-- Update get_dashboard_stats to use the simplified transfers table
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
            AND (
                user_role = 'admin' OR 
                (p_branch_id IS NOT NULL AND (to_branch_id = p_branch_id OR from_branch_id = p_branch_id))
            )
        )
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;
