"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    isDeleting?: boolean;
}

export default function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    isDeleting = false
}: DeleteConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal */}
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-100">
                <div className="flex flex-col items-center p-8 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                        <AlertTriangle size={32} />
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
                    <p className="text-sm text-slate-500 mb-8 max-w-[280px]">
                        {description}
                    </p>

                    <div className="flex w-full gap-3">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="flex-1 rounded-xl border border-slate-200 h-12 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-500 h-12 text-sm font-bold text-white hover:bg-rose-600 disabled:opacity-50 shadow-lg shadow-rose-100"
                        >
                            {isDeleting ? <Spinner size="xs" color="white" /> : <Trash2 size={18} />}
                            {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
