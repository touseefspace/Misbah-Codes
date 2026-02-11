import { supabaseAdmin } from "@/lib/supabase-admin";
import OrganizationClient from "./OrganizationClient";

/**
 * Organization Page - Admin Only
 * Access is enforced by middleware in proxy.ts - non-admin users are redirected to /salesman
 */
export default async function OrganizationPage() {
    const [{ data: users, error: usersError }, { data: branches, error: branchesError }] = await Promise.all([
        supabaseAdmin
            .from('users')
            .select('*')
            .order('created_at', { ascending: false }),
        supabaseAdmin
            .from('branches')
            .select('*')
            .order('name')
    ]);

    if (usersError || branchesError) {
        console.error("Failed to fetch data:", usersError || branchesError);
        return <div className="p-8 text-red-500 font-bold">Error loading organization data.</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800">Organization</h1>
                <p className="text-sm text-slate-500">Manage users and branches in one place.</p>
            </div>

            <OrganizationClient
                initialUsers={users || []}
                initialBranches={branches || []}
            />
        </div>
    );
}
