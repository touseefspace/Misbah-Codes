"use client";

import { useState } from "react";
import DataTable from "@/components/ui/DataTable";
import {
    ArrowRight,
    Check,
    X,
    Package,
    Calendar,
    User,
    FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Transfer } from "@/lib/types";

interface SalesmanTransfersClientProps {
    initialTransfers: Transfer[];
    userBranchId: string;
}

export default function SalesmanTransfersClient({ initialTransfers, userBranchId }: SalesmanTransfersClientProps) {
    const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);

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
            header: "Route",
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
        }
    ];

    return (
        <div className="h-full flex flex-col">
            <DataTable
                data={initialTransfers}
                columns={columns}
                searchPlaceholder="Search transfers..."
            />

            {/* Transfer Details Modal */}
            {selectedTransfer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Transfer Details</h3>
                                <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                    <span className="font-medium text-slate-700">{selectedTransfer.from_branch?.name}</span>
                                    <ArrowRight size={14} className="text-slate-400" />
                                    <span className="font-medium text-slate-700">{selectedTransfer.to_branch?.name}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedTransfer(null)}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {/* Metadata */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Date</span>
                                    <div className="flex items-center gap-2 font-medium text-slate-700">
                                        <Calendar size={14} className="text-slate-400" />
                                        {new Date(selectedTransfer.created_at).toLocaleString()}
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Requester</span>
                                    <div className="flex items-center gap-2 font-medium text-slate-700">
                                        <User size={14} className="text-slate-400" />
                                        {selectedTransfer.requester?.full_name || 'Unknown'}
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedTransfer.notes && (
                                <div className="mb-6">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <FileText size={14} />
                                        Notes
                                    </h4>
                                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-900 text-sm">
                                        {selectedTransfer.notes}
                                    </div>
                                </div>
                            )}

                            {/* Items List */}
                            <div className="space-y-4">
                                <h4 className="border-b border-slate-100 pb-2 text-xs font-bold uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                    <Package size={14} />
                                    Items Requested
                                </h4>
                                <div className="space-y-2">
                                    {selectedTransfer.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 bg-slate-50 rounded-md border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs">
                                                    {idx + 1}
                                                </div>
                                                <span className="font-bold text-slate-700">{item.product?.name}</span>
                                            </div>
                                            <div className="font-mono font-bold text-slate-900 bg-slate-50 px-3 py-1 rounded border border-slate-200">
                                                {item.quantity} <span className="text-xs text-slate-400 uppercase ml-1">{item.unit}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer (Status) */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Status</span>
                            <div className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest border",
                                selectedTransfer.status === 'pending' ? "bg-amber-100 text-amber-700 border-amber-200" :
                                    selectedTransfer.status === 'completed' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                        "bg-rose-100 text-rose-700 border-rose-200"
                            )}>
                                {selectedTransfer.status === 'pending' && "Pending Review"}
                                {selectedTransfer.status === 'completed' && (
                                    <>
                                        <Check size={14} /> Approved
                                    </>
                                )}
                                {selectedTransfer.status === 'rejected' && (
                                    <>
                                        <X size={14} /> Rejected
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

