"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

/**
 * Salesman requests a stock transfer from another branch.
 * Supports multiple items in a single request.
 */
export async function requestStockTransferAction(payload: {
    fromBranchId: string;
    items: { productId: string; unit: 'carton' | 'tray' | 'kg'; quantity: number }[];
    notes?: string;
}) {
    const { userId, sessionClaims } = await auth();
    if (!userId) throw new Error("Unauthenticated");

    const toBranchId = (sessionClaims?.metadata as any)?.branch_id;
    if (!toBranchId) throw new Error("User has no branch assigned");

    try {
        // 1. Create Transfer Header
        const { data: transfer, error: transferError } = await supabaseAdmin
            .from('transfers')
            .insert({
                from_branch_id: payload.fromBranchId,
                to_branch_id: toBranchId,
                requested_by: userId,
                notes: payload.notes || `Stock request from ${userId}`,
                status: 'pending'
            })
            .select()
            .single();

        if (transferError) throw transferError;

        // 2. Create Transfer Items
        const itemsToInsert = payload.items.map(item => ({
            transfer_id: transfer.id,
            product_id: item.productId,
            unit: item.unit,
            quantity: item.quantity
        }));

        const { error: itemsError } = await supabaseAdmin
            .from('transfer_items')
            .insert(itemsToInsert);

        if (itemsError) {
            // Rollback transfer header if items fail
            await supabaseAdmin.from('transfers').delete().eq('id', transfer.id);
            throw itemsError;
        }

        revalidatePath('/salesman/inventory');
        revalidatePath('/admin/transfers');
        revalidatePath('/salesman/transfers');

        return { success: true, transferId: transfer.id };
    } catch (err: any) {
        console.error("❌ Transfer request failed:", err);
        return { success: false, error: err.message || "Failed to process transfer request" };
    }
}

/**
 * Admin approves a transfer request.
 * This should trigger the DB function to update inventory.
 */
export async function approveStockTransferAction(transferId: string) {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as any)?.role;

    if (role !== 'admin') {
        throw new Error("Unauthorized: Only admins can approve transfers.");
    }

    try {
        const { error } = await supabaseAdmin
            .from('transfers')
            .update({
                status: 'completed', // Trigger completion logic
                approved_by: userId,
                updated_at: new Date().toISOString()
            })
            .eq('id', transferId);

        if (error) throw error;

        revalidatePath('/admin/transfers');
        revalidatePath('/admin/reports/inventory');
        revalidatePath('/salesman/inventory');

        return { success: true };
    } catch (err: any) {
        console.error("❌ Transfer approval failed:", err);
        return { success: false, error: err.message || "Failed to approve transfer" };
    }
}

/**
 * Admin rejects a transfer request.
 */
export async function rejectStockTransferAction(transferId: string, notes?: string) {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as any)?.role;

    if (role !== 'admin') {
        throw new Error("Unauthorized");
    }

    try {
        const { error } = await supabaseAdmin
            .from('transfers')
            .update({
                status: 'rejected',
                approved_by: userId,
                notes: notes ? `Rejected: ${notes}` : 'Rejected by admin',
                updated_at: new Date().toISOString()
            })
            .eq('id', transferId);

        if (error) throw error;

        revalidatePath('/admin/transfers');

        return { success: true };
    } catch (err: any) {
        console.error("❌ Transfer rejection failed:", err);
        return { success: false, error: err.message || "Failed to reject transfer" };
    }
}

/**
 * Fetches transfers. 
 * Admins see all, Salesmen see their branch ones.
 */
export async function getTransfersAction(filters?: { status?: string; branchId?: string }) {
    const { userId, sessionClaims } = await auth();
    if (!userId) throw new Error("Unauthenticated");

    const role = (sessionClaims?.metadata as any)?.role;
    const userBranchId = (sessionClaims?.metadata as any)?.branch_id;

    try {
        let query = supabaseAdmin
            .from('transfers')
            .select(`
                *,
                from_branch:from_branch_id(name),
                to_branch:to_branch_id(name),
                requester:requested_by(full_name),
                items:transfer_items(
                    *,
                    product:product_id(name)
                )
            `);

        if (role !== 'admin') {
            // Salesman: only see transfers involving their branch
            query = query.or(`from_branch_id.eq.${userBranchId},to_branch_id.eq.${userBranchId}`);
        } else if (filters?.branchId) {
            query = query.or(`from_branch_id.eq.${filters.branchId},to_branch_id.eq.${filters.branchId}`);
        }

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (err: any) {
        console.error("❌ Failed to fetch transfers:", err);
        return { success: false, error: err.message || "Failed to fetch transfers" };
    }
}
