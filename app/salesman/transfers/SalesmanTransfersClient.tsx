"use client";

import { useState } from "react";
import DataTable from "@/components/ui/DataTable";
import {
    ArrowRight,
    CheckCircle2,
    XCircle,
    Clock,
    Package
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Transfer {
    id: string;
    from_branch_id: string;
    to_branch_id: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    requested_by: string;
    notes: string;
    created_at: string;
    from_branch: { name: string };
    to_branch: { name: string };
    product: { name: string };
    unit: string;
    quantity: number;
}

interface SalesmanTransfersClientProps {
    initialTransfers: Transfer[];
}

export default function SalesmanTransfersClient({ initialTransfers }: SalesmanTransfersClientProps) {
    const [transfers] = useState(initialTransfers);

    const columns = [
        {
            header: "Transfer Details",
            accessor: (t: Transfer) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{t.from_branch.name}</span>
                        <ArrowRight size={14} className="text-slate-400" />
                        <span className="font-bold text-slate-800">{t.to_branch.name}</span>
                    </div>
                </div>
            )
        },
        {
            header: "Product",
            accessor: (t: Transfer) => (
                <div className="flex items-center gap-2 text-xs">
                    <Package size={12} className="text-slate-400" />
                    <span className="font-bold text-slate-700">{t.product?.name || "Unknown Product"}</span>
                    <span className="text-slate-500">{t.quantity} {t.unit}</span>
                </div>
            )
        },
        {
            header: "Status",
            accessor: (t: Transfer) => (
                <div className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border shadow-sm",
                    t.status === 'completed' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                    t.status === 'pending' && "bg-amber-50 text-amber-700 border-amber-100",
                    t.status === 'rejected' && "bg-rose-50 text-rose-700 border-rose-100"
                )}>
                    {t.status === 'completed' && <CheckCircle2 size={12} />}
                    {t.status === 'pending' && <Clock size={12} />}
                    {t.status === 'rejected' && <XCircle size={12} />}
                    {t.status}
                </div>
            )
        },
        {
            header: "Date",
            accessor: (t: Transfer) => (
                <span className="text-xs text-slate-500 font-medium">
                    {new Date(t.created_at).toLocaleDateString()}
                </span>
            )
        }
    ];

    return (
        <DataTable
            data={transfers}
            columns={columns}
            searchPlaceholder="Search transfers..."
        />
    );
}
