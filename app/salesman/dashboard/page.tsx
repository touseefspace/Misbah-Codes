import { UserButton } from "@clerk/nextjs";
import { getDashboardStatsAction } from "@/app/actions";
import { formatCurrency } from "@/lib/utils";

export default async function SalesmanDashboard() {
    const statsResult = await getDashboardStatsAction();
    const stats = statsResult.success && statsResult.data ? statsResult.data : {
        total_sales_today: 0,
        pending_transfers: 0
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Salesman Dashboard</h1>
                <UserButton afterSignOutUrl="/" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-slate-500 text-sm font-medium mb-1">Your Sales (Today)</h3>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.total_sales_today)}</p>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-slate-500 text-sm font-medium mb-1">Pending Transfers</h3>
                    <p className="text-2xl font-bold text-amber-600">{stats.pending_transfers} Requests</p>
                </div>
            </div>

            <div className="mt-8 p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                <p className="text-slate-400">Select an option from the sidebar to get started.</p>
            </div>
        </div>
    );
}
