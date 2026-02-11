import { getTransactionsAction } from "@/app/actions";
import PurchasesListClient from "./PurchasesListClient";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function PurchasesListPage() {
    const { data: transactions, error } = await getTransactionsAction('purchase');

    if (error) {
        return <div className="p-8 text-red-500 font-bold">Error loading purchases: {error}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Purchase History</h1>
                    <p className="text-sm text-slate-500">Log and verify stock incoming from your suppliers.</p>
                </div>
                <Link
                    href="/admin/purchases/create"
                    className="flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
                >
                    <Plus size={18} />
                    New Purchase
                </Link>
            </div>

            <PurchasesListClient initialTransactions={transactions || []} />
        </div>
    );
}
