"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function createBranchAction(data: { name: string; location: string; is_admin_branch?: boolean }) {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as any)?.role;

    // Only admins can create branches
    if (role !== 'admin') {
        throw new Error("Unauthorized");
    }

    try {
        const { error } = await supabaseAdmin
            .from('branches')
            .insert({
                ...data,
                created_at: new Date().toISOString()
            });

        if (error) throw error;

        revalidatePath('/admin/branches');
        return { success: true };
    } catch (err: any) {
        console.error("❌ Failed to create branch:", err);
        return { success: false, error: err.message };
    }
}

export async function getBranchesAction() {
    try {
        const { data, error } = await supabaseAdmin
            .from('branches')
            .select('*')
            .order('name');

        if (error) throw error;
        return { success: true, data };
    } catch (err: any) {
        console.error("❌ Failed to fetch branches:", err);
        return { success: false, error: err.message };
    }
}

export async function assignBranchToUserAction(userId: string, branchId: string | null) {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as any)?.role;

    if (role !== 'admin') {
        throw new Error("Unauthorized");
    }

    try {
        console.log(`Assigning branch ${branchId} to user ${userId}`);

        // 1. Update Supabase
        const { error } = await supabaseAdmin
            .from('users')
            .update({ branch_id: branchId })
            .eq('id', userId);

        if (error) throw error;

        // 2. Update Clerk Metadata
        // We need to update Clerk so the user's session token will have the new branch_id on next refresh
        const { createClerkClient } = await import('@clerk/nextjs/server');
        const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                branch_id: branchId
            }
        });

        revalidatePath('/admin/users');
        return { success: true };
    } catch (err: any) {
        console.error("❌ Failed to assign branch:", err);
        return { success: false, error: err.message };
    }
}
