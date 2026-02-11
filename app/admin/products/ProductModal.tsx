"use client";

import { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Spinner from "@/components/ui/Spinner";
import { upsertProductAction } from "@/app/actions";

interface Product {
    id?: string;
    name: string;
    description: string | null;
    cost_price_carton: number;
    selling_price_carton: number;
    cost_price_tray: number;
    selling_price_tray: number;
    cost_price_kg: number;
    selling_price_kg: number;
    kg_per_tray?: number;
    tray_per_carton?: number;
    kg_per_carton?: number;
}

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: any) => void;
    product: Product | null;
}

export default function ProductModal({ isOpen, onClose, onSave, product }: ProductModalProps) {
    const [formData, setFormData] = useState<Product>({
        name: "",
        description: "",
        cost_price_carton: 0,
        selling_price_carton: 0,
        cost_price_tray: 0,
        selling_price_tray: 0,
        cost_price_kg: 0,
        selling_price_kg: 0,
        kg_per_tray: 0,
        tray_per_carton: 0,
        kg_per_carton: 0
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (product) {
            setFormData({
                ...product,
                description: product.description || ""
            });
        }
    }, [product]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            const result = await upsertProductAction(formData);
            if (result.success) {
                toast.success(product ? "Product updated!" : "Product created!");
                onSave(result.data);
            } else {
                setError(result.error || "Failed to save product");
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-100">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                    <h2 className="text-xl font-bold text-slate-900">
                        {product ? "Edit Product" : "Add New Product"}
                    </h2>
                    <button onClick={onClose} className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="overflow-y-auto p-6 flex flex-col gap-8 max-h-[calc(90vh-140px)]">
                    {error && (
                        <div className="flex items-start gap-3 rounded-xl bg-rose-50 p-4 text-rose-800 border-2 border-rose-100 shadow-sm">
                            <AlertCircle size={20} className="mt-0.5 shrink-0" />
                            <div className="flex flex-col gap-1">
                                <span className="font-bold">Execution Error</span>
                                <p className="text-sm font-medium leading-relaxed opacity-90">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <label className="block">
                            <span className="text-sm font-bold text-slate-700">Product Name</span>
                            <input
                                required
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Tomato Red Local"
                                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-bold text-slate-700">Description</span>
                            <textarea
                                name="description"
                                value={formData.description || ""}
                                onChange={handleChange}
                                placeholder="Short description..."
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 min-h-[80px]"
                            />
                        </label>
                    </div>

                    {/* Pricing Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Carton Pricing */}
                        <div className="space-y-4 rounded-2xl bg-slate-50/50 p-4 border border-slate-100 shadow-sm">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Carton Pricing</h3>
                            <label className="block">
                                <span className="text-[10px] font-bold text-slate-600 uppercase">Cost (AED)</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="cost_price_carton"
                                    value={formData.cost_price_carton}
                                    onChange={handleChange}
                                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-700 outline-none focus:border-emerald-500 shadow-sm"
                                />
                            </label>
                            <label className="block">
                                <span className="text-[10px] font-bold text-slate-600 uppercase">Sell (AED)</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="selling_price_carton"
                                    value={formData.selling_price_carton}
                                    onChange={handleChange}
                                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-700 outline-none focus:border-emerald-500 shadow-sm"
                                />
                            </label>
                        </div>

                        {/* Tray Pricing */}
                        <div className="space-y-4 rounded-2xl bg-slate-50/50 p-4 border border-slate-100 shadow-sm">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Tray Pricing</h3>
                            <label className="block">
                                <span className="text-[10px] font-bold text-slate-600 uppercase">Cost (AED)</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="cost_price_tray"
                                    value={formData.cost_price_tray}
                                    onChange={handleChange}
                                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-700 outline-none focus:border-emerald-500 shadow-sm"
                                />
                            </label>
                            <label className="block">
                                <span className="text-[10px] font-bold text-slate-600 uppercase">Sell (AED)</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="selling_price_tray"
                                    value={formData.selling_price_tray}
                                    onChange={handleChange}
                                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-700 outline-none focus:border-emerald-500 shadow-sm"
                                />
                            </label>
                        </div>

                        {/* KG Pricing */}
                        <div className="space-y-4 rounded-2xl bg-slate-50/50 p-4 border border-slate-100 shadow-sm">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">KG Pricing</h3>
                            <label className="block">
                                <span className="text-[10px] font-bold text-slate-600 uppercase">Cost (AED)</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="cost_price_kg"
                                    value={formData.cost_price_kg}
                                    onChange={handleChange}
                                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-700 outline-none focus:border-emerald-500 shadow-sm"
                                />
                            </label>
                            <label className="block">
                                <span className="text-[10px] font-bold text-slate-600 uppercase">Sell (AED)</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="selling_price_kg"
                                    value={formData.selling_price_kg}
                                    onChange={handleChange}
                                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-700 outline-none focus:border-emerald-500 shadow-sm"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Conversion Ratios */}
                    <div className="grid grid-cols-3 gap-6">
                        <label className="block">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">KG per Tray</span>
                            <input
                                type="number"
                                step="0.001"
                                name="kg_per_tray"
                                value={formData.kg_per_tray}
                                onChange={handleChange}
                                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500 shadow-sm"
                            />
                        </label>
                        <label className="block">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Trays per Carton</span>
                            <input
                                type="number"
                                name="tray_per_carton"
                                value={formData.tray_per_carton}
                                onChange={handleChange}
                                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500 shadow-sm"
                            />
                        </label>
                        <label className="block">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">KG per Carton</span>
                            <input
                                type="number"
                                step="0.001"
                                name="kg_per_carton"
                                value={formData.kg_per_carton}
                                onChange={handleChange}
                                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500 shadow-sm"
                            />
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4 mt-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-12 rounded-xl border border-slate-200 bg-white font-black text-slate-600 transition-all hover:bg-slate-50 active:scale-95 shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-2 flex items-center justify-center gap-3 h-12 rounded-xl bg-emerald-600 font-black text-white transition-all hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-200 active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-200"
                        >
                            {isSaving ? (
                                <Spinner size="sm" color="white" />
                            ) : (
                                <Save size={20} />
                            )}
                            {isSaving ? "Synchronizing..." : "Save Product"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
