"use server";

import { auth, createClerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function checkApprovalStatusAction() {
    const { userId } = await auth();

    if (!userId) {
        return { isApproved: false, error: "Not authenticated" };
    }

    try {
        console.log(`🔍 Action: Checking DB status for ${userId}`);
        const { data: userData, error: supabaseError } = await supabaseAdmin
            .from('users')
            .select('is_approved, role, branch_id')
            .eq('id', userId)
            .maybeSingle();

        if (supabaseError) {
            console.error('Action: Supabase error:', supabaseError);
            return { isApproved: false, error: supabaseError.message };
        }

        console.log('Action: DB User Data:', userData);

        if (userData?.is_approved) {
            console.log(`✨ Action: User ${userId} is approved in DB. Attempting to sync to Clerk...`);
            try {
                const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

                // Proactively sync to Clerk metadata so the next token refresh has the data
                await clerkClient.users.updateUserMetadata(userId, {
                    publicMetadata: {
                        role: userData.role,
                        is_approved: userData.is_approved,
                        branch_id: userData.branch_id
                    }
                });
                console.log('✅ Action: Clerk metadata updated');
            } catch (clerkError) {
                console.error('⚠️ Action: Clerk metadata sync failed (but user is approved):', clerkError);
            }
            return { isApproved: true };
        }

        return { isApproved: false };
    } catch (err) {
        console.error('Action: Critical error:', err);
        return { isApproved: false, error: "Internal server error" };
    }
}

export async function updateUserStatusAction(targetUserId: string, updates: { role?: string; is_approved?: boolean }) {
    const { userId: requesterId, sessionClaims } = await auth();

    // 1. Security check: Only admins can update user status
    const requesterRole = (sessionClaims?.metadata as any)?.role;
    if (requesterRole !== 'admin') {
        throw new Error("Unauthorized: Only admins can manage users.");
    }

    console.log(`👤 Admin ${requesterId} updating user ${targetUserId}: ${JSON.stringify(updates)}`);

    try {
        // 2. Update Supabase
        const { error: sbError } = await supabaseAdmin
            .from('users')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', targetUserId);

        if (sbError) throw sbError;

        // 3. Update Clerk Metadata to ensure session matches
        const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

        await clerkClient.users.updateUserMetadata(targetUserId, {
            publicMetadata: {
                ...updates
            }
        });

        // 4. Invalidate cache
        const { revalidatePath } = await import('next/cache');
        revalidatePath('/admin/users');

        console.log(`✅ User ${targetUserId} updated successfully`);
        return { success: true };
    } catch (err) {
        console.error(`❌ Failed to update user ${targetUserId}:`, err);
        return { success: false, error: "Failed to update user status" };
    }
}

// --- Product Management Actions ---

export async function getProductsAction() {
    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .order('name');

        if (error) throw error;
        return { success: true, data };
    } catch (err) {
        console.error("❌ Failed to fetch products:", err);
        return { success: false, error: "Failed to fetch products" };
    }
}

export async function upsertProductAction(product: any) {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as any)?.role;

    if (role !== 'admin') {
        throw new Error("Unauthorized");
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .upsert({
                ...product,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/admin/products');

        return { success: true, data };
    } catch (err) {
        console.error("❌ Failed to upsert product:", err);
        return { success: false, error: "Failed to save product" };
    }
}

export async function deleteProductAction(productId: string) {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as any)?.role;

    if (role !== 'admin') {
        throw new Error("Unauthorized");
    }

    try {
        const { error } = await supabaseAdmin
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) throw error;

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/admin/products');

        return { success: true };
    } catch (err) {
        console.error("❌ Failed to delete product:", err);
        return { success: false, error: "Failed to delete product" };
    }
}

// --- Dashboard & Stats Actions ---

export async function getDashboardStatsAction() {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        return { success: false, error: "Not authenticated" };
    }

    try {
        const branchId = (sessionClaims?.metadata as any)?.branch_id;

        const { data, error } = await supabaseAdmin.rpc('get_dashboard_stats', {
            p_user_id: userId,
            p_branch_id: branchId || null
        });

        if (error) throw error;
        return { success: true, data };
    } catch (err) {
        console.error("❌ Failed to fetch dashboard stats:", err);
        return { success: false, error: "Failed to load dashboard metrics" };
    }
}

// --- Transaction Actions ---

export async function createTransactionAction(payload: {
    type: 'sale' | 'purchase';
    entityId: string;
    totalAmount: number;
    paidAmount: number;
    items: any[];
}) {
    const { userId, sessionClaims } = await auth();
    if (!userId) throw new Error("Unauthenticated");

    const branchId = (sessionClaims?.metadata as any)?.branch_id;
    if (!branchId) throw new Error("User has no branch assigned");

    try {
        // 1. Create the transaction
        const { data: tx, error: txError } = await supabaseAdmin
            .from('transactions')
            .insert({
                type: payload.type,
                entity_id: payload.entityId,
                branch_id: branchId,
                total_amount: payload.totalAmount,
                paid_amount: payload.paidAmount,
                created_by: userId
            })
            .select()
            .single();

        if (txError) throw txError;

        // 2. Create the items
        const itemsToInsert = payload.items.map(item => ({
            transaction_id: tx.id,
            product_id: item.productId,
            unit: item.unit,
            quantity: item.quantity,
            cost_price: item.costPrice,
            selling_price: item.sellingPrice,
            amount: item.amount
        }));

        const { error: itemsError } = await supabaseAdmin
            .from('transaction_items')
            .insert(itemsToInsert);

        if (itemsError) {
            // Rollback (Not atomic in this client, but DB triggers handle consistency)
            await supabaseAdmin.from('transactions').delete().eq('id', tx.id);
            throw itemsError;
        }

        // 3. Create initial payment/ledger entry
        if (payload.paidAmount > 0) {
            await supabaseAdmin.from('payments').insert({
                entity_id: payload.entityId,
                transaction_id: tx.id,
                branch_id: branchId,
                amount: payload.paidAmount,
                payment_type: payload.type === 'sale' ? 'credit' : 'debit',
                notes: `Initial payment for ${payload.type} ${tx.id.slice(0, 8)}`,
                created_by: userId
            });
        }

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/admin/dashboard');
        revalidatePath('/admin/sales');
        revalidatePath('/salesman/dashboard');
        revalidatePath('/salesman/sales');

        return { success: true, transactionId: tx.id };
    } catch (err) {
        console.error("❌ Transaction failed:", err);
        return { success: false, error: "Transaction failed to process" };
    }
}

export async function getEntitiesAction(type?: 'customer' | 'supplier') {
    try {
        let query = supabaseAdmin.from('entities').select('*');
        if (type) {
            query = query.eq('type', type);
        }
        const { data, error } = await query.order('name');
        if (error) throw error;
        return { success: true, data };
    } catch (err) {
        console.error("❌ Failed to fetch entities:", err);
        return { success: false, error: "Failed to fetch entities" };
    }
}

export async function getTransactionsAction(type?: 'sale' | 'purchase') {
    const { userId, sessionClaims } = await auth();
    if (!userId) throw new Error("Unauthenticated");

    const role = (sessionClaims?.metadata as any)?.role;
    const branchId = (sessionClaims?.metadata as any)?.branch_id;

    try {
        let query = supabaseAdmin
            .from('transactions')
            .select(`
                *,
                entities (name),
                branches (name)
            `);

        if (type) {
            query = query.eq('type', type);
        }

        // Salesmen only see their branch's sales
        if (role !== 'admin') {
            if (!branchId) throw new Error("User has no branch assigned");
            query = query.eq('branch_id', branchId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return { success: true, data };
    } catch (err) {
        console.error("❌ Failed to fetch transactions:", err);
        return { success: false, error: "Failed to fetch transactions" };
    }
}

export async function getInventoryAction(branchId?: string) {
    try {
        let query = supabaseAdmin
            .from('inventory')
            .select(`
                *,
                products (name, kg_per_tray, tray_per_carton, kg_per_carton),
                branches (name)
            `);

        if (branchId) {
            query = query.eq('branch_id', branchId);
        }

        const { data, error } = await query.order('quantity_kg', { ascending: false });
        if (error) throw error;
        return { success: true, data };
    } catch (err) {
        console.error("❌ Failed to fetch inventory:", err);
        return { success: false, error: "Failed to fetch inventory" };
    }
}

export async function upsertEntityAction(entity: any) {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as any)?.role;

    // Suppliers are Admin only, Customers can be added by Salesman or Admin
    if (entity.type === 'supplier' && role !== 'admin') {
        throw new Error("Unauthorized: Only admins can manage suppliers.");
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('entities')
            .upsert({
                ...entity,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/admin/customers');
        revalidatePath('/admin/suppliers');
        revalidatePath('/salesman/customers');

        return { success: true, data };
    } catch (err) {
        console.error("❌ Failed to upsert entity:", err);
        return { success: false, error: "Failed to save record" };
    }
}
