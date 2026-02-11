import { create } from 'zustand';
import { getEntitiesAction, upsertEntityAction } from '@/app/actions';

export interface Entity {
    id: string;
    name: string;
    type: 'customer' | 'supplier';
    phone: string | null;
    location: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface EntityState {
    customers: Entity[];
    suppliers: Entity[];
    isLoading: boolean;
    error: string | null;
    lastFetched: Date | null;

    fetchEntities: (force?: boolean) => Promise<void>;
    addEntity: (entity: Partial<Entity>) => Promise<{ success: boolean; error?: string; data?: Entity }>;
    updateEntity: (entity: Partial<Entity>) => Promise<{ success: boolean; error?: string; data?: Entity }>;
}

export const useEntityStore = create<EntityState>((set, get) => ({
    customers: [],
    suppliers: [],
    isLoading: false,
    error: null,
    lastFetched: null,

    fetchEntities: async (force = false) => {
        const { lastFetched, isLoading } = get();
        if (!force && lastFetched && (new Date().getTime() - lastFetched.getTime() < 5 * 60 * 1000)) {
            return;
        }

        if (isLoading) return;

        set({ isLoading: true, error: null });
        try {
            const result = await getEntitiesAction();
            if (result.success && result.data) {
                const customers = result.data.filter((e: Entity) => e.type === 'customer');
                const suppliers = result.data.filter((e: Entity) => e.type === 'supplier');
                set({
                    customers,
                    suppliers,
                    lastFetched: new Date(),
                    isLoading: false
                });
            } else {
                set({ error: result.error || "Failed to fetch entities", isLoading: false });
            }
        } catch (err) {
            set({ error: "An unexpected error occurred", isLoading: false });
        }
    },

    addEntity: async (entity) => {
        set({ isLoading: true, error: null });
        try {
            const result = await upsertEntityAction(entity);
            if (result.success && result.data) {
                const newEntity = result.data as Entity;
                if (newEntity.type === 'customer') {
                    set({ customers: [...get().customers, newEntity].sort((a, b) => a.name.localeCompare(b.name)) });
                } else {
                    set({ suppliers: [...get().suppliers, newEntity].sort((a, b) => a.name.localeCompare(b.name)) });
                }
                set({ isLoading: false });
                return { success: true, data: newEntity };
            } else {
                set({ isLoading: false });
                return { success: false, error: result.error };
            }
        } catch (err) {
            set({ isLoading: false });
            return { success: false, error: "Failed to add entity" };
        }
    },

    updateEntity: async (entity) => {
        set({ isLoading: true, error: null });
        try {
            const result = await upsertEntityAction(entity);
            if (result.success && result.data) {
                const updatedEntity = result.data as Entity;
                if (updatedEntity.type === 'customer') {
                    const updatedCustomers = get().customers.map(c => c.id === updatedEntity.id ? updatedEntity : c)
                        .sort((a, b) => a.name.localeCompare(b.name));
                    set({ customers: updatedCustomers });
                } else {
                    const updatedSuppliers = get().suppliers.map(s => s.id === updatedEntity.id ? updatedEntity : s)
                        .sort((a, b) => a.name.localeCompare(b.name));
                    set({ suppliers: updatedSuppliers });
                }
                set({ isLoading: false });
                return { success: true, data: updatedEntity };
            } else {
                set({ isLoading: false });
                return { success: false, error: result.error };
            }
        } catch (err) {
            set({ isLoading: false });
            return { success: false, error: "Failed to update entity" };
        }
    }
}));
