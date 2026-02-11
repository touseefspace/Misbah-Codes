"use client";

import DataTable from "@/components/ui/DataTable";
import { Package, MapPin, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InventoryListClientProps {
    initialInventory: any[];
}

export default function InventoryListClient({ initialInventory }: InventoryListClientProps) {
    const columns = [
        {
            header: "Product",
            accessor: (inv: any) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Package size={20} />
                    </div>
                    <span className="font-bold text-slate-800">{inv.products?.name || "N/A"}</span>
                </div>
            )
        },
        {
            header: "Branch",
            accessor: (inv: any) => (
                <div className="flex items-center gap-2 text-slate-500">
                    <MapPin size={14} />
                    <span className="text-sm">{inv.branches?.name || "N/A"}</span>
                </div>
            )
        },
        {
            header: "Stock Level (KG)",
            accessor: (inv: any) => (
                <div className="flex flex-col">
                    <span className={cn(
                        "font-black",
                        inv.quantity_kg < 50 ? "text-rose-600" : "text-slate-900"
                    )}>
                        {inv.quantity_kg.toLocaleString()} KG
                    </span>
                    {inv.quantity_kg < 50 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 uppercase">
                            <AlertTriangle size={10} />
                            Low Stock
                        </span>
                    )}
                </div>
            )
        },
        {
            header: "Units (Approx)",
            accessor: (inv: any) => {
                const p = inv.products;
                if (!p) return null;

                const cartons = p.kg_per_carton ? (inv.quantity_kg / p.kg_per_carton).toFixed(1) : null;
                const trays = p.kg_per_tray ? (inv.quantity_kg / p.kg_per_tray).toFixed(1) : null;

                return (
                    <div className="flex flex-col text-[10px] text-slate-500">
                        {cartons && <span>{cartons} Cartons</span>}
                        {trays && <span>{trays} Trays</span>}
                    </div>
                );
            }
        }
    ];

    return (
        <DataTable
            data={initialInventory}
            columns={columns}
            searchPlaceholder="Search by product or branch..."
        />
    );
}
