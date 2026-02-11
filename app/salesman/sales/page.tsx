import { auth } from "@clerk/nextjs/server";
import { getTransactionsAction } from "@/app/actions";
import SalesListClient from "./SalesListClient";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function SalesmanSalesPage() {
    const { sessionClaims } = await auth();
    const branchId = (sessionClaims?.metadata as any)?.branch_id;

    // Fetch sales transactions (filtered by branch on server)
    const { data: transactions, error } = await getTransactionsAction('sale');

    if (error) {
        return <div className="p-8 text-red-500 font-bold">Error loading sales: {error}</div>;
    }

    return (
        <div className="space-y-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Sales</h1>
                    <p className="text-sm text-slate-500">View and manage your branch sales transactions.</p>
                </div>
                <Link
                    href="/salesman/sales/create"
                    className="flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
                >
                    <Plus size={18} />
                    New Sale
                </Link>
            </div>

            <SalesListClient initialTransactions={transactions || []} />
        </div>
    );
}
