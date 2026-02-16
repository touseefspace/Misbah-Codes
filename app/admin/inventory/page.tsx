import { getInventoryAction } from "@/app/actions";
import { getBranchesAction } from "@/app/actions/branch-actions";
import InventoryClient from "./InventoryClient";

export default async function AdminInventoryPage() {
    const [inventoryResult, branchesResult] = await Promise.all([
        getInventoryAction(),
        getBranchesAction()
    ]);

    if (inventoryResult.error || branchesResult.error) {
        return <div className="p-8 text-red-500 font-bold">Error loading inventory data.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Inventory Overview</h1>
                    <p className="text-sm text-slate-500">View stock levels across all branches or filter by specific branch.</p>
                </div>
            </div>

            <InventoryClient
                initialInventory={inventoryResult.data || []}
                branches={branchesResult.data || []}
            />
        </div>
    );
}

