import { create } from 'zustand';
import { getBranchesAction, createBranchAction } from '@/app/actions/branch-actions';

export interface Branch {
    id: string;
    name: string;
    location: string | null;
    is_admin_branch: boolean;
    created_at: string;
}

interface BranchState {
    branches: Branch[];
    isLoading: boolean;
    error: string | null;
    lastFetched: Date | null;

    fetchBranches: (force?: boolean) => Promise<void>;
    setBranches: (branches: Branch[]) => void;
    addBranch: (branchData: { name: string; location: string; is_admin_branch?: boolean }) => Promise<{ success: boolean; error?: string }>;
}

export const useBranchStore = create<BranchState>((set, get) => ({
    branches: [],
    isLoading: false,
    error: null,
    lastFetched: null,

    setBranches: (branches) => set({ branches, lastFetched: new Date() }),

    fetchBranches: async (force = false) => {
        const { lastFetched, isLoading } = get();
        if (!force && lastFetched && (new Date().getTime() - lastFetched.getTime() < 5 * 60 * 1000)) {
            return;
        }

        if (isLoading) return;

        set({ isLoading: true, error: null });
        try {
            const result = await getBranchesAction();
            if (result.success && result.data) {
                set({ branches: result.data, lastFetched: new Date(), isLoading: false });
            } else {
                set({ error: result.error || "Failed to fetch branches", isLoading: false });
            }
        } catch (err) {
            set({ error: "An unexpected error occurred", isLoading: false });
        }
    },

    addBranch: async (branchData) => {
        set({ isLoading: true, error: null });
        try {
            const result = await createBranchAction(branchData);
            if (result.success) {
                // We'll refetch to get the full object including ID
                await get().fetchBranches(true);
                set({ isLoading: false });
                return { success: true };
            } else {
                set({ isLoading: false });
                return { success: false, error: result.error };
            }
        } catch (err) {
            set({ isLoading: false });
            return { success: false, error: "Failed to create branch" };
        }
    }
}));
