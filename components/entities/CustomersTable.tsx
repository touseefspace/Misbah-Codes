"use client";

import { useState } from "react";
import {
    User,
    Phone,
    MapPin,
    Calendar,
    ChevronRight,
    Search
} from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { cn } from "@/lib/utils";

interface Customer {
    id: string;
    name: string;
    phone?: string;
    location?: string;
    created_at: string;
}

interface CustomersTableProps {
    initialCustomers: Customer[];
}

export default function CustomersTable({ initialCustomers }: CustomersTableProps) {
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
        <div className="flex items-center justify-end">
            <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-800 active:scale-95 shadow-sm">
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
        />
    );
}
