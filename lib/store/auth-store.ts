import { create } from 'zustand';
import { checkApprovalStatusAction } from '@/app/actions';

interface AuthState {
    isApproved: boolean;
    role: string | null;
    isSyncing: boolean;
    error: string | null;
    lastSynced: Date | null;

    // Actions
    syncStatus: () => Promise<boolean>;
    reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    isApproved: false,
    role: null,
    isSyncing: false,
    error: null,
    lastSynced: null,

    syncStatus: async () => {
        set({ isSyncing: true, error: null });
        try {
            const result = await checkApprovalStatusAction();

            if (result.error) {
                set({ error: result.error, isSyncing: false });
                return false;
            }

            const isApproved = result.isApproved || false;
            set({
                isApproved,
                isSyncing: false,
                lastSynced: new Date()
            });

            return isApproved;
        } catch (err) {
            set({ error: "Failed to sync status", isSyncing: false });
            return false;
        }
    },

    reset: () => set({
        isApproved: false,
        role: null,
        isSyncing: false,
        error: null,
        lastSynced: null
    })
}));
