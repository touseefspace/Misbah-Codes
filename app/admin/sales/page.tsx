import { getTransactionsAction } from "@/app/actions";
import SalesListClient from "./SalesListClient";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function SalesListPage() {
    const { data: transactions, error } = await getTransactionsAction('sale');

    if (error) {
        return <div className="p-8 text-red-500 font-bold">Error loading sales: {error}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Sales History</h1>
                    <p className="text-sm text-slate-500">Track and manage all customer sales transactions.</p>
                </div>
                <Link
                    href="/admin/sales/create"
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
