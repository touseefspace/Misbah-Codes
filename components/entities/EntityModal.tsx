"use client";

import { useState, useEffect } from "react";
import { X, Save, AlertCircle, User, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import Spinner from "@/components/ui/Spinner";

interface Entity {
    id?: string;
    name: string;
    phone?: string;
    location?: string;
    type: 'customer' | 'supplier';
}

interface EntityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (entity: any) => void;
    entity: Entity | null;
    type: 'customer' | 'supplier';
}

export default function EntityModal({ isOpen, onClose, onSave, entity, type }: EntityModalProps) {
    const [formData, setFormData] = useState<Entity>({
        name: "",
        phone: "",
        location: "",
        type: type
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (entity) {
            setFormData(entity);
        } else {
            setFormData({
                name: "",
                phone: "",
                location: "",
                type: type
            });
        }
    }, [entity, type, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            await onSave(formData);
            toast.success(`${type === 'customer' ? 'Customer' : 'Supplier'} saved successfully`);
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to save");
            toast.error("Failed to save record");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>

            {/* Modal */}
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-100">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                    <h2 className="text-xl font-bold text-slate-900">
                        {entity ? `Edit ${type}` : `Add New ${type}`}
                    </h2>
                    <button onClick={onClose} className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="flex items-start gap-3 rounded-xl bg-rose-50 p-4 text-rose-800 border border-rose-100">
                            <AlertCircle size={20} className="shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <label className="block">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <User size={14} /> Full Name
                            </span>
                            <input
                                required
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Al Misbah Trading"
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                            />
                        </label>

                        <label className="block">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <Phone size={14} /> Phone Number
                            </span>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone || ""}
                                onChange={handleChange}
                                placeholder="+971 50 XXXXXXX"
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                            />
                        </label>

                        <label className="block">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <MapPin size={14} /> Location
                            </span>
                            <textarea
                                name="location"
                                value={formData.location || ""}
                                onChange={handleChange}
                                placeholder="Shop/Store location details..."
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 min-h-[100px]"
                            />
                        </label>
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-12 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-2 flex items-center justify-center gap-2 h-12 rounded-xl bg-slate-900 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50 shadow-lg shadow-slate-200"
                        >
                            {isSaving ? <Spinner size="xs" color="white" /> : <Save size={18} />}
                            {isSaving ? "Saving..." : "Save Record"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
