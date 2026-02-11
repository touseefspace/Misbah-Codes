import { getTransfersAction } from "@/app/actions/transfer-actions";
import SalesmanTransfersClient from "./SalesmanTransfersClient";

export default async function SalesmanTransfersPage() {
    const { data: transfers, error } = await getTransfersAction();

    if (error) {
        return <div className="p-8 text-red-500 font-bold">Error loading transfers.</div>;
    }

    return (
        <div className="space-y-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">My Transfer Requests</h1>
                    <p className="text-sm text-slate-500">Track the status of your stock requests.</p>
                </div>
            </div>

            <SalesmanTransfersClient initialTransfers={transfers || []} />
        </div>
    );
}
