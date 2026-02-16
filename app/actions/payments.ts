"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

// --- Types ---

export interface UnpaidTransaction {
    id: string;
    created_at: string;
    total_amount: number;
    paid_amount: number;
    balance: number;
    notes?: string;
    type: 'sale' | 'purchase';
}

export interface PaymentAllocation {
    transactionId: string;
    amountToPay: number;
    originalBalance: number;
    remainingBalance: number;
    date: string;
    notes?: string;
}

export interface PaymentPreview {
    allocations: PaymentAllocation[];
    totalAllocated: number;
    remainingPaymentAmount: number; // Should be 0 based on rules, but good for validation
}

// --- Actions ---

export async function getUnpaidTransactionsAction(entityId: string, type: 'purchase' | 'sale') {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Not authenticated" };

    try {
        const { data, error } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('entity_id', entityId)
            .eq('type', type)
            .gt('balance', 0)
            .order('created_at', { ascending: true }); // FIFO: Oldest first

        if (error) throw error;

        return { success: true, data: data as UnpaidTransaction[] };
    } catch (err) {
        console.error("❌ Failed to fetch unpaid transactions:", err);
        return { success: false, error: "Failed to fetch unpaid transactions" };
    }
}

export async function processPaymentAction(payload: {
    entityId: string;
    amount: number;
    type: 'purchase' | 'sale'; // 'purchase' for supplier payment, 'sale' for customer payment
}) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return { success: false, error: "Not authenticated" };

    const branchId = (sessionClaims?.metadata as any)?.branch_id;
    if (!branchId && (sessionClaims?.metadata as any)?.role !== 'admin') {
        // Admins might not have a branch, but for now payments usually happen in a context.
        // If admin, we can maybe fetch branch from the entity or transaction? 
        // For simplicity, let's assume admin pays on behalf of the branch where the tx happened.
        // BUT, we are paying multiple transactions which might be from different branches?
        // Requirement: "Record Payment... linked to the relevant Transaction ID".
        // The `payments` table has a `branch_id`.
        // Let's assume the user's current branch if set, otherwise we might need to handle this.
        // For now, fail if no branch_id for non-admin. Admin can default to the transaction's branch (first one?) or a default.
    }

    // Simplification: We use the branch_id from the first transaction being paid, or the user's branch.
    // If Admin has no branch, we might need a fallback.
    // Let's check the Schema: `payments.branch_id` is NOT NULL.

    try {
        // 1. Fetch latest state of unpaid transactions to ensure consistency
        const { data: transactions, error: txError } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('entity_id', payload.entityId)
            .eq('type', payload.type)
            .gt('balance', 0)
            .order('created_at', { ascending: true });

        if (txError) throw txError;
        if (!transactions || transactions.length === 0) {
            return { success: false, error: "No outstanding balance found." };
        }

        // 2. Client-side logic for allocation (Server-side here for security)
        let remainingPayment = payload.amount;
        const allocations: {
            transaction_id: string;
            amount: number;
            branch_id: string
        }[] = [];

        // Validate Validation: Prevent overpayment
        const totalOutstanding = transactions.reduce((sum, tx) => sum + (Number(tx.balance) || 0), 0);
        if (remainingPayment > totalOutstanding) {
            return { success: false, error: `Payment amount (${remainingPayment}) exceeds total outstanding balance (${totalOutstanding}).` };
        }

        for (const tx of transactions) {
            if (remainingPayment <= 0) break;

            const balance = Number(tx.balance);
            const payAmount = Math.min(balance, remainingPayment);

            allocations.push({
                transaction_id: tx.id,
                amount: payAmount,
                branch_id: tx.branch_id // Use the transaction's branch for the payment record
            });

            remainingPayment -= payAmount;
        }

        if (remainingPayment > 0.001) { // Floating point tolerance
            // This technically shouldn't happen due to the check above, but as a safeguard.
            return { success: false, error: "Payment amount exceeds allocated balance (Logic Error)." };
        }

        // 3. Execute Updates (Sequential for now, ideally batch/RPC)
        // We need to:
        // A. Create Payment Record linked to Tx
        // B. Update Transaction Record (paid_amount, balance)

        for (const alloc of allocations) {
            // A. Insert Payment
            const { error: payError } = await supabaseAdmin
                .from('payments')
                .insert({
                    entity_id: payload.entityId,
                    transaction_id: alloc.transaction_id,
                    branch_id: alloc.branch_id,
                    amount: alloc.amount,
                    payment_type: payload.type === 'purchase' ? 'debit' : 'credit', // Supplier Payment (Debit their balance aka we reduce our debt), Customer Payment (Credit their debt)
                    // Wait, let's verify Schema/Logic.
                    // Supplier: We owe them (Purchase). We pay them. Their balance (Payable) decreases.
                    // Customer: They owe us (Sale). They pay us. Their balance (Receivable) decreases.
                    // `payment_type` USER-DEFINED. Usually 'credit' or 'debit'.
                    // Let's stick to: Sale Payment -> Credit (Money In). Purchase Payment -> Debit (Money Out).
                    notes: `Payment for ${payload.type} #${alloc.transaction_id.slice(0, 8)}`,
                    created_by: userId
                });

            if (payError) throw payError;

            // B. Update Transaction
            // We need to increment paid_amount and recalculate balance.

            // 1. Get current transaction state
            const { data: currentTx, error: fetchTxError } = await supabaseAdmin
                .from('transactions')
                .select('paid_amount, total_amount')
                .eq('id', alloc.transaction_id)
                .single();

            if (fetchTxError || !currentTx) {
                console.error(`❌ Failed to fetch transaction ${alloc.transaction_id} for update:`, fetchTxError);
                throw new Error(`Failed to fetch transaction ${alloc.transaction_id} for update`);
            }

            // 2. Calculate new values
            const currentPaid = Number(currentTx.paid_amount) || 0;
            const total = Number(currentTx.total_amount) || 0;
            const newPaid = currentPaid + alloc.amount;
            const newBalance = total - newPaid;

            // 3. Update transaction
            // NOTE: 'balance' seems to be a generated column based on schema (DEFAULT total - paid).
            // Postgres generated columns cannot be updated directly.
            const { error: updateTxError } = await supabaseAdmin
                .from('transactions')
                .update({
                    paid_amount: newPaid,
                    // balance: newBalance, // Removed: Generated column
                    updated_at: new Date().toISOString()
                })
                .eq('id', alloc.transaction_id);

            if (updateTxError) {
                console.error(`❌ Failed to update transaction ${alloc.transaction_id}:`, updateTxError);
                throw new Error(`Failed to update transaction ${alloc.transaction_id}: ${updateTxError.message}`);
            }

            console.log(`✅ Updated Tx ${alloc.transaction_id}: Paid ${currentPaid} -> ${newPaid}, Balance -> ${newBalance}`);
        }

        // 4. Revalidate
        revalidatePath('/admin/suppliers');
        revalidatePath(`/admin/suppliers/${payload.entityId}`);
        revalidatePath('/admin/dashboard');
        revalidatePath('/admin/purchases');
        revalidatePath('/admin/sales');

        return { success: true };

    } catch (err: any) {
        console.error("❌ Process Payment Failed:", err);
        return { success: false, error: err.message || "Failed to process payment" };
    }
}
