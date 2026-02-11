"use client";

import { useState, useMemo } from "react";
import {
    Plus,
    Trash2,
    Save,
    AlertCircle,
    Calculator,
    Truck,
    Package,
    ArrowRight
} from "lucide-react";
import { createTransactionAction } from "@/app/actions";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Spinner from "@/components/ui/Spinner";

interface Product {
    id: string;
    name: string;
    description: string | null;
    cost_price_carton: number;
    selling_price_carton: number;
    cost_price_tray: number;
    selling_price_tray: number;
    cost_price_kg: number;
    selling_price_kg: number;
}

interface Entity {
    id: string;
    name: string;
}

interface PurchaseItem {
    id: string;
    productId: string;
    unit: 'carton' | 'tray' | 'kg';
    quantity: number;
    costPrice: number;
    sellingPrice: number;
    amount: number;
}

interface PurchaseEntryFormProps {
    products: Product[];
    suppliers: Entity[];
}

export default function PurchaseEntryForm({ products, suppliers }: PurchaseEntryFormProps) {
    const router = useRouter();
    const [entityId, setEntityId] = useState("");
    const [items, setItems] = useState<PurchaseItem[]>([
        { id: Math.random().toString(), productId: "", unit: "carton", quantity: 1, costPrice: 0, sellingPrice: 0, amount: 0 }
    ]);
    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Totals Calculation
    const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);
    const balance = totalAmount - paidAmount;

    const handleAddItem = () => {
        setItems([
            ...items,
            { id: Math.random().toString(), productId: "", unit: "carton", quantity: 1, costPrice: 0, sellingPrice: 0, amount: 0 }
        ]);
    };

    const handleRemoveItem = (id: string) => {
        if (items.length === 1) return;
        setItems(items.filter(item => item.id !== id));
    };

    const handleItemChange = (id: string, updates: Partial<PurchaseItem>) => {
        setItems(items.map(item => {
            if (item.id !== id) return item;

            const updatedItem = { ...item, ...updates };

            // Auto-update prices when product or unit changes
            if (updates.productId || updates.unit) {
                const product = products.find(p => p.id === updatedItem.productId);
                if (product) {
                    updatedItem.costPrice = product[`cost_price_${updatedItem.unit}` as keyof Product] as number || 0;
                    updatedItem.sellingPrice = product[`selling_price_${updatedItem.unit}` as keyof Product] as number || 0;
                }
            }

            // Recalculate amount (Purchase uses costPrice)
            updatedItem.amount = updatedItem.quantity * updatedItem.costPrice;
            return updatedItem;
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!entityId) {
            toast.error("Please select a supplier");
            return setError("Please select a supplier");
        }
        if (items.some(i => !i.productId || i.quantity <= 0)) {
            toast.error("Please fill all item details");
            return setError("Please fill all item details");
        }

        setIsSaving(true);
        setError(null);

        try {
            const result = await createTransactionAction({
                type: 'purchase',
                entityId,
                totalAmount,
                paidAmount,
                items
            });

            if (result.success) {
                toast.success("Purchase recorded successfully!");
                router.push('/admin/dashboard');
            } else {
                setError(result.error || "Failed to create transaction");
                toast.error(result.error || "Submission failed");
            }
        } catch (err) {
            setError("An unexpected error occurred");
            toast.error("An error occurred during submission");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 lg:flex-row items-start">
            {/* Main Form Area */}
            <div className="flex-1 space-y-6 w-full">
                {/* Supplier Selection */}
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
                    <div className="mb-4 flex items-center gap-2 text-slate-800">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                            <Truck size={20} />
                        </div>
                        <h3 className="font-bold">Supplier Details</h3>
                    </div>
                    <select
                        required
                        value={entityId}
                        onChange={(e) => setEntityId(e.target.value)}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                    >
                        <option value="">Select a Supplier</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                {/* Items List */}
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-800">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                                <Package size={20} />
                            </div>
                            <h3 className="font-bold">Purchased Items</h3>
                        </div>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-amber-600 transition-all hover:bg-amber-100 active:scale-95"
                        >
                            <Plus size={16} />
                            Add Item
                        </button>
                    </div>

                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item.id} className="group relative flex flex-col gap-4 rounded-2xl bg-slate-50/50 p-4 border border-slate-100 transition-all hover:border-amber-200 hover:bg-amber-50/20 md:flex-row md:items-end shadow-sm">
                                <div className="flex-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Product</span>
                                    <select
                                        required
                                        value={item.productId}
                                        onChange={(e) => handleItemChange(item.id, { productId: e.target.value })}
                                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-amber-500 shadow-sm"
                                    >
                                        <option value="">Choose...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="w-full md:w-32">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unit</span>
                                    <select
                                        value={item.unit}
                                        onChange={(e) => handleItemChange(item.id, { unit: e.target.value as any })}
                                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-amber-500 shadow-sm"
                                    >
                                        <option value="carton">Carton</option>
                                        <option value="tray">Tray</option>
                                        <option value="kg">KG</option>
                                    </select>
                                </div>

                                <div className="w-full md:w-24">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Qty</span>
                                    <input
                                        type="number"
                                        step="0.001"
                                        required
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-amber-500 shadow-sm"
                                    />
                                </div>

                                <div className="w-full md:w-28">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cost Price</span>
                                    <div className="mt-1 flex h-10 items-center px-1 text-sm font-bold text-slate-800">
                                        AED {item.costPrice.toLocaleString()}
                                    </div>
                                </div>

                                <div className="w-full md:w-32">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Item Total</span>
                                    <div className="mt-1 flex h-10 items-center px-1 text-sm font-black text-amber-600">
                                        AED {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:text-rose-600 hover:border-rose-200 active:scale-90"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sidebar / Summary Area */}
            <aside className="w-full lg:w-[360px] space-y-6">
                <div className="overflow-hidden rounded-3xl bg-slate-900 shadow-2xl shadow-slate-200">
                    <div className="bg-amber-600 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Calculator className="text-white" size={24} />
                            <h3 className="text-lg font-black text-white uppercase tracking-wider">Order Summary</h3>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="space-y-4 border-b border-white/5 pb-6">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                                <span>Total Cost</span>
                                <span className="text-white">AED {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">GROSS PAYABLE</span>
                                <span className="text-3xl font-black text-amber-400 tracking-tight">AED {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>

                            <div className="space-y-4 rounded-2xl bg-white/5 p-5 border border-white/10 shadow-inner">
                                <label className="block">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Paid to Supplier (AED)</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                        className="mt-2 h-12 w-full rounded-xl bg-white/10 px-4 text-lg font-black text-white outline-none transition-all focus:ring-2 focus:ring-amber-500"
                                    />
                                </label>

                                <div className="flex justify-between border-t border-white/10 pt-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Outstanding</span>
                                    <span className={cn(
                                        "font-black text-sm",
                                        balance > 0 ? "text-rose-400" : "text-emerald-400"
                                    )}>
                                        AED {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-start gap-3 rounded-xl bg-rose-500/10 p-4 text-rose-200 border border-rose-500/20 shadow-lg">
                                <AlertCircle size={20} className="shrink-0" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Record Error</span>
                                    <p className="text-xs font-semibold leading-relaxed">{error}</p>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex w-full items-center justify-center gap-3 h-16 rounded-2xl bg-amber-500 font-black text-slate-900 text-lg transition-all hover:bg-amber-400 active:scale-95 disabled:opacity-50 shadow-xl shadow-amber-500/20"
                        >
                            {isSaving ? (
                                <Spinner size="md" color="slate" />
                            ) : (
                                <Save size={24} />
                            )}
                            {isSaving ? "Synchronizing..." : "Finish Purchase"}
                            {!isSaving && <ArrowRight size={20} className="ml-1" />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-4 text-[10px] justify-center text-slate-400 font-bold uppercase tracking-tighter text-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    <span>Supplier Ledger & Inventory Sync Active</span>
                </div>
            </aside>
        </form>
    );
}
