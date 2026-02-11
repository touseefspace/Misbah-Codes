import { getTransfersAction } from "@/app/actions/transfer-actions";
import { getBranchesAction } from "@/app/actions/branch-actions";
import AdminTransfersClient from "./AdminTransfersClient";

export default async function AdminTransfersPage() {
    const [transfersResult, branchesResult] = await Promise.all([
        getTransfersAction(),
        getBranchesAction()
    ]);

    if (!transfersResult.success || !branchesResult.success) {
        return <div className="p-8 text-red-500 font-bold">Error loading transfers or branches.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Stock Transfers</h1>
                    <p className="text-sm text-slate-500">Manage stock transfer requests between branches.</p>
                </div>
            </div>

            <AdminTransfersClient
                initialTransfers={transfersResult.data || []}
                branches={branchesResult.data || []}
            />
        </div>
    );
}
