import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function DashboardDispatcher() {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    // 1. Try to get role from Clerk Metadata (Fastest)
    let role = (sessionClaims?.metadata as { role?: string })?.role;
    let isApproved = (sessionClaims?.metadata as { is_approved?: boolean })?.is_approved;

    // 2. Fallback: If not approved or missing role, check Supabase directly
    // This handles the case where the user was just approved manually in the DB.
    if (!isApproved || !role) {
        console.log(`🔍 Dashboard: Falling back to Supabase check for user ${userId}`);
        console.log(`Current session claims: ${JSON.stringify(sessionClaims?.metadata)}`);

        const { data: userData, error: supabaseError } = await supabaseAdmin
            .from('users')
            .select('role, is_approved, branch_id')
            .eq('id', userId)
            .maybeSingle();

        if (supabaseError) {
            console.error('❌ Dashboard: Supabase error:', supabaseError);
        }

        console.log(`DB User Data: ${JSON.stringify(userData)}`);

        if (userData) {
            role = userData.role;
            isApproved = userData.is_approved;

            // 3. Proactively sync back to Clerk so Middleware is happy next time
            if (isApproved) {
                console.log('🔄 Dashboard: Syncing approved status back to Clerk metadata...');
                try {
                    const { createClerkClient } = await import('@clerk/nextjs/server');
                    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
                    await clerkClient.users.updateUserMetadata(userId, {
                        publicMetadata: {
                            role: userData.role,
                            is_approved: userData.is_approved,
                            branch_id: userData.branch_id
                        }
                    });
                    console.log('✅ Dashboard: Clerk metadata synced');
                } catch (err) {
                    console.error('⚠️ Dashboard: Failed to sync metadata to Clerk:', err);
                }
            }
        } else {
            console.log('⚠️ Dashboard: No user row found in Supabase yet.');
        }
    }

    // Final checks
    if (!isApproved) {
        redirect("/pending-approval");
    }

    if (role === "admin") {
        redirect("/admin/dashboard");
    }

    if (role === "salesman") {
        redirect("/salesman/dashboard");
    }

    // Fallback if role is unknown
    redirect("/pending-approval");
}
