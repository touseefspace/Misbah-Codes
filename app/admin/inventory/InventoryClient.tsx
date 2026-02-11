"use client";

import { useState, useMemo } from "react";
import DataTable from "@/components/ui/DataTable";
import { Package, MapPin, AlertTriangle, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface InventoryItem {
    id: string;
    branch_id: string;
    product_id: string;
    quantity_carton: number;
    quantity_tray: number;
    quantity_kg: number;
    last_updated: string;
    products: {
        name: string;
        kg_per_tray?: number;
        tray_per_carton?: number;
        kg_per_carton?: number;
    };
    branches: {
        name: string;
    };
}

interface Branch {
    id: string;
    name: string;
    is_admin_branch: boolean;
}

interface InventoryClientProps {
    initialInventory: InventoryItem[];
    branches: Branch[];
}

// Helper function to calculate total KG from all units using product conversion ratios
function calculateTotalKg(
    cartons: number,
    trays: number,
    kg: number,
    product: { kg_per_tray?: number; kg_per_carton?: number }
): number {
    let totalKg = kg || 0;

    // Convert cartons to KG if we have the ratio
    if (cartons && product.kg_per_carton) {
        totalKg += cartons * product.kg_per_carton;
    }

    // Convert trays to KG if we have the ratio
    if (trays && product.kg_per_tray) {
        totalKg += trays * product.kg_per_tray;
    }

    return totalKg;
}

// Calculate display values for all units from total KG
function getDisplayUnits(
    totalKg: number,
    product: { kg_per_tray?: number; tray_per_carton?: number; kg_per_carton?: number }
) {
    return {
        kg: totalKg,
        trays: product.kg_per_tray ? totalKg / product.kg_per_tray : null,
        cartons: product.kg_per_carton ? totalKg / product.kg_per_carton : null
    };
}

export default function InventoryClient({ initialInventory, branches }: InventoryClientProps) {
    const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

    // Filter inventory by selected branch
    const filteredInventory = useMemo(() => {
        if (!selectedBranchId) return initialInventory;
        return initialInventory.filter(item => item.branch_id === selectedBranchId);
    }, [initialInventory, selectedBranchId]);

    // Aggregate inventory when viewing all branches
    const aggregatedInventory = useMemo(() => {
        if (selectedBranchId) return filteredInventory;

        const productMap = new Map<string, {
            product_id: string;
            products: { name: string; kg_per_tray?: number; tray_per_carton?: number; kg_per_carton?: number; };
            totalKg: number;
            branchCount: number;
        }>();

        initialInventory.forEach(item => {
            const itemTotalKg = calculateTotalKg(
                item.quantity_carton || 0,
                item.quantity_tray || 0,
                item.quantity_kg || 0,
                item.products
            );

            const existing = productMap.get(item.product_id);
            if (existing) {
                existing.totalKg += itemTotalKg;
                existing.branchCount += 1;
            } else {
                productMap.set(item.product_id, {
                    product_id: item.product_id,
                    products: item.products,
                    totalKg: itemTotalKg,
                    branchCount: 1
                });
            }
        });

        return Array.from(productMap.values());
    }, [initialInventory, selectedBranchId, filteredInventory]);

    const columnsForBranch = [
        {
            header: "Product",
            accessor: (inv: InventoryItem) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Package size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{inv.products?.name}</span>
                        {inv.products?.kg_per_carton && (
                            <span className="text-[10px] text-slate-400">
                                {inv.products.kg_per_carton}kg/ctn
                                {inv.products.kg_per_tray && ` • ${inv.products.kg_per_tray}kg/tray`}
                            </span>
                        )}
                    </div>
                </div>
            )
        },
        {
            header: "Branch",
            accessor: (inv: InventoryItem) => (
                <div className="flex items-center gap-2 text-slate-500">
                    <MapPin size={14} />
                    <span className="text-sm">{inv.branches?.name}</span>
                </div>
            )
        },
        {
            header: "Stock Level",
            accessor: (inv: InventoryItem) => {
                const totalKg = calculateTotalKg(
                    inv.quantity_carton || 0,
                    inv.quantity_tray || 0,
                    inv.quantity_kg || 0,
                    inv.products
                );
                const units = getDisplayUnits(totalKg, inv.products);

                return (
                    <div className="flex flex-col gap-1">
                        <span className={cn(
                            "font-black text-lg",
                            totalKg < 50 ? "text-rose-600" : "text-slate-900"
                        )}>
                            {totalKg.toFixed(1)} KG
                        </span>
                        <div className="flex gap-2 text-[11px] text-slate-500">
                            {units.cartons !== null && (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                                    ≈ {units.cartons.toFixed(1)} ctns
                                </span>
                            )}
                            {units.trays !== null && (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                                    ≈ {units.trays.toFixed(1)} trays
                                </span>
                            )}
                        </div>
                        {totalKg < 50 && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 uppercase">
                                <AlertTriangle size={10} />
                                Low Stock
                            </span>
                        )}
                    </div>
                );
            }
        }
    ];

    const columnsForAll = [
        {
            header: "Product",
            accessor: (inv: any) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Package size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{inv.products?.name}</span>
                        <span className="text-[10px] font-semibold text-slate-400">
                            Across {inv.branchCount} branch{inv.branchCount > 1 ? 'es' : ''}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: "Total Stock",
            accessor: (inv: any) => {
                const units = getDisplayUnits(inv.totalKg, inv.products);

                return (
                    <div className="flex flex-col gap-1">
                        <span className={cn(
                            "font-black text-lg",
                            inv.totalKg < 100 ? "text-rose-600" : "text-slate-900"
                        )}>
                            {inv.totalKg.toFixed(1)} KG
                        </span>
                        <div className="flex gap-2 text-[11px] text-slate-500">
                            {units.cartons !== null && (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                                    ≈ {units.cartons.toFixed(1)} ctns
                                </span>
                            )}
                            {units.trays !== null && (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                                    ≈ {units.trays.toFixed(1)} trays
                                </span>
                            )}
                        </div>
                        {inv.totalKg < 100 && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 uppercase">
                                <AlertTriangle size={10} />
                                Low Stock
                            </span>
                        )}
                    </div>
                );
            }
        }
    ];

    return (
        <div className="space-y-4">
            {/* Branch Filter */}
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500">
                    <Filter size={16} />
                    <span className="text-sm font-medium">Filter by Branch:</span>
                </div>
                <select
                    value={selectedBranchId || ""}
                    onChange={(e) => setSelectedBranchId(e.target.value || null)}
                    className="h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                    <option value="">All Branches (Aggregated)</option>
                    {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>
                            {branch.name} {branch.is_admin_branch ? "(Main)" : ""}
                        </option>
                    ))}
                </select>
                <span className="ml-auto text-xs text-slate-400">
                    {selectedBranchId
                        ? `${filteredInventory.length} items`
                        : `${aggregatedInventory.length} products total`}
                </span>
            </div>

            {/* Data Table */}
            <DataTable
                data={(selectedBranchId ? filteredInventory : aggregatedInventory) as any[]}
                columns={selectedBranchId ? columnsForBranch : columnsForAll}
                searchPlaceholder="Search products..."
            />
        </div>
    );
}
