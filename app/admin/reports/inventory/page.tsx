import { getInventoryAction } from "@/app/actions";
import InventoryListClient from "./InventoryListClient";

export default async function InventoryReportPage() {
    const { data: inventory, error } = await getInventoryAction();

    if (error) {
        return <div className="p-8 text-red-500 font-bold">Error loading inventory: {error}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Inventory Report</h1>
                    <p className="text-sm text-slate-500">Real-time stock levels across all active branches.</p>
                </div>
            </div>

            <InventoryListClient initialInventory={inventory || []} />
        </div>
    );
}
