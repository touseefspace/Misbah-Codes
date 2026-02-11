"use client";

import DataTable from "@/components/ui/DataTable";
import { Truck, Calendar } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PurchasesListClientProps {
    initialTransactions: any[];
}

export default function PurchasesListClient({ initialTransactions }: PurchasesListClientProps) {
    const columns = [
        {
            header: "Transaction",
            accessor: (tx: any) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <Truck size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800">TX-{tx.id.slice(0, 8).toUpperCase()}</span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Calendar size={10} />
                            {format(new Date(tx.created_at), "MMM d, yyyy HH:mm")}
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: "Supplier",
            accessor: (tx: any) => (
                <span className="font-medium text-slate-700">{tx.entities?.name || "N/A"}</span>
            )
        },
        {
            header: "Branch",
            accessor: (tx: any) => (
                <span className="text-sm text-slate-500">{tx.branches?.name || "N/A"}</span>
            )
        },
        {
            header: "Total Amount",
            accessor: (tx: any) => (
                <span className="font-bold text-slate-900">AED {tx.total_amount.toLocaleString()}</span>
            )
        },
        {
            header: "Status",
            accessor: (tx: any) => {
                const balance = tx.total_amount - tx.paid_amount;
                return (
                    <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold",
                        balance <= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                        {balance <= 0 ? "Fully Paid" : `Payable AED ${balance}`}
                    </span>
                );
            }
        }
    ];

    return (
        <DataTable
            data={initialTransactions}
            columns={columns}
            searchPlaceholder="Search by ID or supplier..."
        />
    );
}
