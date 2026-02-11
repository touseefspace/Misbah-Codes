"use client";

import { useState } from "react";
import DataTable from "@/components/ui/DataTable";
import { Package, MapPin, Send, AlertTriangle, Plus, ShoppingCart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { requestStockTransferAction } from "@/app/actions/transfer-actions";
import Spinner from "@/components/ui/Spinner";

interface InventoryItem {
    id: string;
    branch_id: string;
    product_id: string;
    quantity_carton?: number;
    quantity_tray?: number;
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

// Helper function to calculate total KG from all units using product conversion ratios
function calculateTotalKg(
    cartons: number,
    trays: number,
    kg: number,
    product: { kg_per_tray?: number; kg_per_carton?: number }
): number {
    let totalKg = kg || 0;

    if (cartons && product.kg_per_carton) {
        totalKg += cartons * product.kg_per_carton;
    }

    if (trays && product.kg_per_tray) {
        totalKg += trays * product.kg_per_tray;
    }

    return totalKg;
}

// Calculate display values for all units from total KG
function getDisplayUnits(
    totalKg: number,
    product: { kg_per_tray?: number; kg_per_carton?: number }
) {
    return {
        kg: totalKg,
        trays: product.kg_per_tray ? totalKg / product.kg_per_tray : null,
        cartons: product.kg_per_carton ? totalKg / product.kg_per_carton : null
    };
}

interface SalesmanInventoryClientProps {
    initialInventory: InventoryItem[];
    userBranchId: string;
}

export default function SalesmanInventoryClient({ initialInventory, userBranchId }: SalesmanInventoryClientProps) {
    const [inventory, setInventory] = useState(initialInventory);
    const [isRequesting, setIsRequesting] = useState(false);
    const [cart, setCart] = useState<{
        productId: string;
        productName: string;
        fromBranchId: string;
        fromBranchName: string;
        unit: 'carton' | 'tray' | 'kg';
        quantity: number;
    }[]>([]);

    // Controlled modal state
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [addItemData, setAddItemData] = useState({
        quantity: 0,
        unit: 'kg' as 'carton' | 'tray' | 'kg',
    });
    const [notes, setNotes] = useState('');

    const addToCart = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem || addItemData.quantity <= 0) return;

        // Check if item from same branch already exists (grouping by transfer source)
        const existingBranch = cart.length > 0 ? cart[0].fromBranchId : null;
        if (existingBranch && existingBranch !== selectedItem.branch_id) {
            toast.error("You can only request items from one branch at a time. Please clear cart first.");
            return;
        }

        setCart([...cart, {
            productId: selectedItem.product_id,
            productName: selectedItem.products.name,
            fromBranchId: selectedItem.branch_id,
            fromBranchName: selectedItem.branches.name,
            unit: addItemData.unit,
            quantity: addItemData.quantity
        }]);

        setSelectedItem(null);
        setAddItemData({ quantity: 0, unit: 'kg' });
        toast.success("Added to cart");
    };

    const removeFromCart = (index: number) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const handleSubmitRequest = async () => {
        if (cart.length === 0) return;
        setIsRequesting(true);

        try {
            const result = await requestStockTransferAction({
                fromBranchId: cart[0].fromBranchId,
                items: cart.map(item => ({
                    productId: item.productId,
                    unit: item.unit,
                    quantity: item.quantity
                })),
                notes: notes
            });

            if (result.success) {
                toast.success("Stock transfer requested successfully!");
                setCart([]);
                setNotes('');
            } else {
                toast.error(result.error || "Failed to request stock");
            }
        } catch (err) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsRequesting(false);
        }
    };

    const columns = [
        {
            header: "Product",
            accessor: (inv: InventoryItem) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Package size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{inv.products?.name}</span>
                        {inv.branch_id === userBranchId && (
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Your Branch</span>
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
        },
        {
            header: "Actions",
            accessor: (inv: InventoryItem) => {
                if (inv.branch_id === userBranchId) return null;
                return (
                    <button
                        onClick={() => setSelectedItem(inv)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                        title="Add to Request"
                    >
                        <Plus size={16} />
                    </button>
                );
            }
        }
    ];

    return (
        <div className="flex gap-6 h-[calc(100vh-100px)]">
            <div className="flex-1 overflow-auto">
                <DataTable
                    data={inventory}
                    columns={columns}
                    searchPlaceholder="Search products or branches..."
                />
            </div>

            {/* Cart Sidebar */}
            <div className="w-80 bg-white border-l border-slate-200 p-6 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6">
                    <div className="h-8 w-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                        <ShoppingCart size={18} />
                    </div>
                    <h2 className="font-bold text-slate-800">Transfer Request</h2>
                </div>

                <div className="flex-1 overflow-auto space-y-3">
                    {cart.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-sm">
                            No items added yet.
                        </div>
                    ) : (
                        <>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                                <span className="text-slate-500">Requesting from:</span>
                                <div className="font-bold text-slate-800">{cart[0].fromBranchName}</div>
                            </div>

                            {cart.map((item, idx) => (
                                <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex justify-between items-center group">
                                    <div>
                                        <div className="font-bold text-slate-700 text-sm">{item.productName}</div>
                                        <div className="text-xs text-slate-500">{item.quantity} {item.unit}</div>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(idx)}
                                        className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 space-y-4">
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes..."
                            className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            rows={2}
                        />
                        <button
                            onClick={handleSubmitRequest}
                            disabled={isRequesting}
                            className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isRequesting ? <Spinner size="xs" color="white" /> : <Send size={16} />}
                            Submit Request
                        </button>
                    </div>
                )}
            </div>

            {/* Add Item Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Add to Request</h3>
                            <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={addToCart} className="p-5 space-y-4">
                            <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-800 font-medium">
                                {selectedItem.products.name}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Quantity</label>
                                    <input
                                        type="number"
                                        min="0.1"
                                        step="0.1"
                                        required
                                        value={addItemData.quantity || ''}
                                        onChange={e => setAddItemData({ ...addItemData, quantity: parseFloat(e.target.value) })}
                                        className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Unit</label>
                                    <select
                                        value={addItemData.unit}
                                        onChange={e => setAddItemData({ ...addItemData, unit: e.target.value as any })}
                                        className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                                    >
                                        <option value="kg">KG</option>
                                        <option value="carton">Carton</option>
                                        <option value="tray">Tray</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800">
                                Add Item
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
