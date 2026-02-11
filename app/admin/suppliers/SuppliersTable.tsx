"use client";

import { useState } from "react";
import {
    Truck,
    Phone,
    MapPin,
    Calendar,
    ChevronRight
} from "lucide-react";
import DataTable from "@/components/ui/DataTable";

interface Supplier {
    id: string;
    name: string;
    phone?: string;
    location?: string;
    created_at: string;
}

interface SuppliersTableProps {
    initialSuppliers: Supplier[];
}

export default function SuppliersTable({ initialSuppliers }: SuppliersTableProps) {
    const [suppliers] = useState<Supplier[]>(initialSuppliers);

    const columns = [
        {
            header: "Supplier",
            accessor: (s: Supplier) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold border border-blue-100 shadow-sm">
                        <Truck size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 tracking-tight">{s.name}</span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">ID: {s.id.slice(0, 8)}</span>
                    </div>
                </div>
            )
        },
        {
            header: "Contact Details",
            accessor: (s: Supplier) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        <Phone size={12} className="text-slate-400" />
                        {s.phone || "No contact"}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <MapPin size={10} />
                        <span className="max-w-[150px] truncate">{s.location || "No location"}</span>
                    </div>
                </div>
            )
        },
        {
            header: "Onboarded",
            accessor: (s: Supplier) => (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Calendar size={14} className="text-slate-300" />
                    {new Date(s.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
            )
        }
    ];

    const actions = (s: Supplier) => (
        <div className="flex items-center justify-end">
            <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-800 active:scale-95 shadow-sm">
                <ChevronRight size={16} />
            </button>
        </div>
    );

    return (
        <DataTable
            data={suppliers}
            columns={columns}
            actions={actions}
            searchPlaceholder="Search suppliers by name..."
        />
    );
}
