"use client";

import { useState } from "react";
import DataTable from "@/components/ui/DataTable";
import { Transfer } from "@/lib/types";
import { Package, ArrowRight, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { approveStockTransferAction, rejectStockTransferAction } from "@/app/actions/transfer-actions";
import { format } from "date-fns";

interface AdminTransfersClientProps {
    initialTransfers: Transfer[];
    branches: { id: string; name: string }[];
}

export default function AdminTransfersClient({ initialTransfers, branches }: AdminTransfersClientProps) {
    const [transfers, setTransfers] = useState(initialTransfers);
    const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const handleAction = async (transferId: string, action: 'approve' | 'reject') => {
        setIsProcessing(transferId);
        try {
            const result = action === 'approve'
                ? await approveStockTransferAction(transferId)
                : await rejectStockTransferAction(transferId);

            if (result.success) {
                toast.success(`Transfer ${action}ed successfully`);
                // Update local state
                setTransfers(prev => prev.map(t =>
                    t.id === transferId
                        ? { ...t, status: action === 'approve' ? 'completed' : 'rejected' }
                        : t
                ));
                setSelectedTransfer(null);
            } else {
                toast.error(result.error || "Failed to perform action");
            }
        } catch (err) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsProcessing(null);
        }
    };

    const columns = [
        {
            header: "Date",
            accessor: (t: Transfer) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-700">{format(new Date(t.created_at), 'MMM d, yyyy')}</span>
                    <span className="text-xs text-slate-400">{format(new Date(t.created_at), 'h:mm a')}</span>
                </div>
            )
        },
        {
            header: "From",
            accessor: (t: Transfer) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-600">{t.from_branch?.name}</span>
                    <ArrowRight size={14} className="text-slate-300" />
                    <span className="font-bold text-slate-800">{t.to_branch?.name}</span>
                </div>
            )
        },
        {
            header: "Items",
            accessor: (t: Transfer) => (
                <button
                    onClick={() => setSelectedTransfer(t)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                >
                    <Package size={16} />
                    {t.items?.length || 0} Items
                </button>
            )
        },
        {
            header: "Requester",
            accessor: (t: Transfer) => t.requester?.full_name || 'Unknown'
        },
        {
            header: "Status",
            accessor: (t: Transfer) => (
                <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    t.status === 'pending' ? "bg-amber-100 text-amber-700" :
                        t.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
                            "bg-rose-100 text-rose-700"
                )}>
                    {t.status}
                </span>
            )
        },
        {
            header: "Actions",
            accessor: (t: Transfer) => {
                if (t.status !== 'pending') return null;
                return (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleAction(t.id, 'approve')}
                            disabled={isProcessing === t.id}
                            className="p-1.5 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200 transition-colors"
                            title="Approve"
                        >
                            <Check size={16} />
                        </button>
                        <button
                            onClick={() => handleAction(t.id, 'reject')}
                            disabled={isProcessing === t.id}
                            className="p-1.5 bg-rose-100 text-rose-600 rounded hover:bg-rose-200 transition-colors"
                            title="Reject"
                        >
                            <X size={16} />
                        </button>
                    </div>
                );
            }
        }
    ];

    return (
        <>
            <DataTable
                data={transfers}
                columns={columns}
                searchPlaceholder="Search transfers..."
            />

            {/* Transfer Details Modal */}
            {selectedTransfer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Transfer Details</h3>
                                <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                    <span className="font-medium">{selectedTransfer.from_branch?.name}</span>
                                    <ArrowRight size={14} />
                                    <span className="font-medium">{selectedTransfer.to_branch?.name}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedTransfer(null)}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {selectedTransfer.notes && (
                                <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-sm">
                                    <span className="font-bold mr-2">Note:</span>
                                    {selectedTransfer.notes}
                                </div>
                            )}

                            <div className="space-y-4">
                                <h4 className="border-b border-slate-100 pb-2 text-xs font-bold uppercase text-slate-500 tracking-widest">Items Requested</h4>
                                {selectedTransfer.items?.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 bg-white rounded-md border border-slate-200 flex items-center justify-center text-slate-400">
                                                <Package size={16} />
                                            </div>
                                            <span className="font-bold text-slate-700">{item.product?.name}</span>
                                        </div>
                                        <div className="font-mono font-bold text-slate-900 bg-white px-3 py-1 rounded border border-slate-200">
                                            {item.quantity} <span className="text-xs text-slate-400 uppercase ml-1">{item.unit}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {selectedTransfer.status === 'pending' && (
                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                                <button
                                    onClick={() => handleAction(selectedTransfer.id, 'reject')}
                                    disabled={!!isProcessing}
                                    className="px-4 py-2 border border-rose-200 text-rose-700 font-bold rounded-xl hover:bg-rose-50 transition-colors"
                                >
                                    Reject Request
                                </button>
                                <button
                                    onClick={() => handleAction(selectedTransfer.id, 'approve')}
                                    disabled={!!isProcessing}
                                    className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                                >
                                    Approve Transfer
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
