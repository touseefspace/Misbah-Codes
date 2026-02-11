import { auth } from "@clerk/nextjs/server";
import { getInventoryAction } from "@/app/actions";
import SalesmanInventoryClient from "./SalesmanInventoryClient";

export default async function SalesmanInventoryPage() {
    const { sessionClaims } = await auth();
    const branchId = (sessionClaims?.metadata as any)?.branch_id;

    // Fetch all inventory (Salesmen can see all now thanks to migration 002)
    const { data: inventory, error } = await getInventoryAction();

    if (error) {
        return <div className="p-8 text-red-500 font-bold">Error loading inventory.</div>;
    }

    return (
        <div className="space-y-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Branch Inventory</h1>
                    <p className="text-sm text-slate-500">View stock levels and request transfers from other branches.</p>
                </div>
            </div>

            <SalesmanInventoryClient
                initialInventory={inventory || []}
                userBranchId={branchId}
            />
        </div>
    );
}
