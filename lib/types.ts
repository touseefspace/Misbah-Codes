export interface Product {
    id: string;
    name: string;
    description: string | null;
    cost_price_carton: number | null;
    cost_price_tray: number | null;
    cost_price_kg: number | null;
    selling_price_carton: number | null;
    selling_price_tray: number | null;
    selling_price_kg: number | null;
    kg_per_tray: number | null;
    tray_per_carton: number | null;
    kg_per_carton: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface Branch {
    id: string;
    name: string;
    location: string | null;
    is_admin_branch: boolean;
}

export interface InventoryItem {
    id: string;
    branch_id: string;
    product_id: string;
    quantity_carton: number;
    quantity_tray: number;
    quantity_kg: number;
    last_updated: string;
    products: Product;
    branches: Branch;
}

export interface TransferItem {
    id: string;
    transfer_id: string;
    product_id: string;
    quantity: number;
    unit: 'carton' | 'tray' | 'kg';
    product?: {
        name: string;
    };
}

export interface Transfer {
    id: string;
    from_branch_id: string;
    to_branch_id: string;
    status: 'pending' | 'completed' | 'rejected';
    requested_by: string;
    approved_by: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    from_branch?: { name: string };
    to_branch?: { name: string };
    requester?: { full_name: string };
    items?: TransferItem[];
}
