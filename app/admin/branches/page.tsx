import { supabaseAdmin } from "@/lib/supabase-admin";
import BranchesClient from "./BranchesClient";

export default async function BranchesPage() {
    const { data: branches, error } = await supabaseAdmin
        .from('branches')
        .select('*')
        .order('name');

    if (error) {
        console.error("Failed to fetch branches:", error);
        return <div className="p-8 text-red-500">Error loading branches. Please try again later.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Branch Management</h1>
                    <p className="text-sm text-slate-500">Create and manage branch locations.</p>
                </div>
            </div>

            <BranchesClient initialBranches={branches || []} />
        </div>
    );
}
