import { create } from 'zustand';
import { getProductsAction, upsertProductAction, deleteProductAction } from '@/app/actions';

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
    created_at: string;
    updated_at: string;
}

interface ProductState {
    products: Product[];
    isLoading: boolean;
    error: string | null;
    lastFetched: Date | null;

    fetchProducts: (force?: boolean) => Promise<void>;
    addProduct: (product: Partial<Product>) => Promise<{ success: boolean; error?: string }>;
    updateProduct: (product: Partial<Product>) => Promise<{ success: boolean; error?: string }>;
    deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export const useProductStore = create<ProductState>((set, get) => ({
    products: [],
    isLoading: false,
    error: null,
    lastFetched: null,

    fetchProducts: async (force = false) => {
        const { lastFetched, isLoading } = get();
        // Cache for 5 minutes unless forced
        if (!force && lastFetched && (new Date().getTime() - lastFetched.getTime() < 5 * 60 * 1000)) {
            return;
        }

        if (isLoading) return;

        set({ isLoading: true, error: null });
        try {
            const result = await getProductsAction();
            if (result.success && result.data) {
                set({ products: result.data, lastFetched: new Date(), isLoading: false });
            } else {
                set({ error: result.error || "Failed to fetch products", isLoading: false });
            }
        } catch (err) {
            set({ error: "An unexpected error occurred", isLoading: false });
        }
    },

    addProduct: async (product) => {
        set({ isLoading: true, error: null });
        try {
            const result = await upsertProductAction(product);
            if (result.success && result.data) {
                const newProducts = [...get().products, result.data].sort((a, b) => a.name.localeCompare(b.name));
                set({ products: newProducts, isLoading: false });
                return { success: true };
            } else {
                set({ isLoading: false });
                return { success: false, error: result.error };
            }
        } catch (err) {
            set({ isLoading: false });
            return { success: false, error: "Failed to add product" };
        }
    },

    updateProduct: async (product) => {
        set({ isLoading: true, error: null });
        try {
            const result = await upsertProductAction(product);
            if (result.success && result.data) {
                const updatedProducts = get().products.map(p =>
                    p.id === result.data.id ? result.data : p
                ).sort((a, b) => a.name.localeCompare(b.name));
                set({ products: updatedProducts, isLoading: false });
                return { success: true };
            } else {
                set({ isLoading: false });
                return { success: false, error: result.error };
            }
        } catch (err) {
            set({ isLoading: false });
            return { success: false, error: "Failed to update product" };
        }
    },

    deleteProduct: async (id) => {
        set({ isLoading: true, error: null });
        try {
            // Optimistic update
            const oldProducts = get().products;
            set({ products: oldProducts.filter(p => p.id !== id) });

            const result = await deleteProductAction(id);
            if (result.success) {
                set({ isLoading: false });
                return { success: true };
            } else {
                // Revert if failed
                set({ products: oldProducts, isLoading: false, error: result.error });
                return { success: false, error: result.error };
            }
        } catch (err) {
            // Revert if failed
            // Note: in a real app we might need a more robust rollback
            set({ isLoading: false });
            return { success: false, error: "Failed to delete product" };
        }
    }
}));
