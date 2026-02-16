import { getTransfersAction } from "@/app/actions/transfer-actions";
import SalesmanTransfersClient from "./SalesmanTransfersClient";
import { auth } from "@clerk/nextjs/server";

export default async function SalesmanTransfersPage() {
    const { sessionClaims } = await auth();
    const branchId = (sessionClaims?.metadata as any)?.branch_id;
    const { data: transfers, error } = await getTransfersAction();

    if (error) {
        return <div className="p-8 text-red-500 font-bold">Error loading transfers.</div>;
    }

    return (
        <div className="space-y-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Transfer Management</h1>
                    <p className="text-sm text-slate-500">Track and manage stock transfers.</p>
                </div>
            </div>

            <SalesmanTransfersClient
                initialTransfers={transfers || []}
                userBranchId={branchId}
            />
        </div>
    );
}
