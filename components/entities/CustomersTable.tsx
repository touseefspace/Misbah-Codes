"use client";

import { useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
    User,
    Phone,
    MapPin,
    Calendar,
    ChevronRight,
    Search,
    Edit,
    Trash2
} from "lucide-react";
import DataTable from "@/components/ui/DataTable";

interface Customer {
    id: string;
    name: string;
    phone?: string;
    location?: string;
    created_at: string;
    outstanding_balance?: number;
}

interface CustomersTableProps {
    initialCustomers: Customer[];
    onEdit: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
}

export default function CustomersTable({ initialCustomers, onEdit, onDelete }: CustomersTableProps) {
    const router = useRouter();
    const [customers] = useState<Customer[]>(initialCustomers);

    const columns = [
        {
            header: "Customer",
            accessor: (c: Customer) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 font-bold border border-orange-100 shadow-sm">
                        <User size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 tracking-tight">{c.name}</span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">ID: {c.id.slice(0, 8)}</span>
                    </div>
                </div>
            )
        },
        {
            header: "Contact",
            accessor: (c: Customer) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        <Phone size={12} className="text-slate-400" />
                        {c.phone || "No phone recorded"}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <MapPin size={10} />
                        <span className="max-w-[150px] truncate">{c.location || "No location"}</span>
                    </div>
                </div>
            )
        },
        {
            header: "Outstanding",
            accessor: (c: Customer) => {
                const balance = c.outstanding_balance || 0;
                return (
                    <span className={cn(
                        "font-bold text-sm",
                        balance > 0 ? "text-rose-600" : "text-emerald-600"
                    )}>
                        {formatCurrency(balance)}
                    </span>
                );
            }
        },
        {
            header: "Joined",
            accessor: (c: Customer) => (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Calendar size={14} className="text-slate-300" />
                    {new Date(c.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
            )
        }
    ];

    const actions = (c: Customer) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <button
                onClick={() => onEdit(c)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-orange-600 transition-colors"
                title="Edit Customer"
            >
                <Edit size={16} />
            </button>
            <button
                onClick={() => onDelete(c)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                title="Delete Customer"
            >
                <Trash2 size={16} />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-white text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-800 active:scale-95 shadow-sm">
                <ChevronRight size={16} />
            </button>
        </div>
    );

    return (
        <DataTable
            data={customers}
            columns={columns}
            actions={actions}
            searchPlaceholder="Search customers by name or contact..."
            onRowClick={(c) => router.push(`/admin/customers/${c.id}`)}
        />
    );
}
