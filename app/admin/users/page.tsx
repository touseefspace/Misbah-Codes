import { supabaseAdmin } from "@/lib/supabase-admin";
import UsersTable from "./UsersTable"; // I'll create this next

export default async function UsersPage() {
    // Fetch users and branches from Supabase
    const [{ data: users, error: usersError }, { data: branches, error: branchesError }] = await Promise.all([
        supabaseAdmin
            .from('users')
            .select('*')
            .order('created_at', { ascending: false }),
        supabaseAdmin
            .from('branches')
            .select('id, name')
            .order('name')
    ]);

    if (usersError || branchesError) {
        console.error("Failed to fetch data:", usersError || branchesError);
        return <div className="p-8 text-red-500">Error loading users or branches. Please try again later.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">User Management</h1>
                    <p className="text-sm text-slate-500">Approve new signups and manage system roles.</p>
                </div>
            </div>

            <UsersTable initialUsers={users || []} branches={branches || []} />
        </div>
    );
}
