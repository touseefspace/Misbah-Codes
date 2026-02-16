"use client";

import { useState } from "react";
import {
    Calendar,
    ChevronRight,
    Edit,
    Trash2,
    Truck,
    Phone,
    MapPin,
    Banknote
} from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { useRouter } from "next/navigation";
import { cn, formatCurrency } from "@/lib/utils";
import { useEffect } from "react";

interface Supplier {
    id: string;
    name: string;
    phone?: string;
    location?: string;
    created_at: string;
    outstanding_balance?: number;
}

interface SuppliersTableProps {
    initialSuppliers: Supplier[];
    onEdit: (supplier: Supplier) => void;
    onDelete: (supplier: Supplier) => void;
}

export default function SuppliersTable({ initialSuppliers, onEdit, onDelete }: SuppliersTableProps) {
    const router = useRouter();
    const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);

    useEffect(() => {
        setSuppliers(initialSuppliers);
    }, [initialSuppliers]);

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
            header: "Outstanding",
            accessor: (s: Supplier) => {
                const balance = s.outstanding_balance || 0;
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
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    // Navigate to Ledger with payment action
                    router.push(`/admin/suppliers/${s.id}?action=payment`);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                title="Record Payment"
            >
                <Banknote size={16} />
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit(s);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                title="Edit Supplier"
            >
                <Edit size={16} />
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(s);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                title="Delete Supplier"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );

    return (
        <DataTable
            data={suppliers}
            columns={columns}
            actions={actions}
            searchPlaceholder="Search suppliers by name..."
            onRowClick={(s) => router.push(`/admin/suppliers/${s.id}`)}
        />
    );
}
