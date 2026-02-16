"use client";

import { useEffect, useState } from "react";
import {
    ArrowLeft,
    ArrowDownLeft,
    ArrowUpRight,
    Calendar,
    DollarSign,
    FileText,
    Filter,
    Banknote
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { getEntityLedgerAction } from "@/app/actions";
import { cn, formatCurrency } from "@/lib/utils";
import Spinner from "@/components/ui/Spinner";
import PaymentModal from "./PaymentModal";

interface LedgerItem {
    id: string;
    created_at: string;
    item_type: 'transaction' | 'payment';
    total_amount?: number; // For transactions
    amount?: number;       // For payments
    type?: 'sale' | 'purchase'; // For transactions
    payment_type?: 'credit' | 'debit'; // For payments
    balance?: number; // Transaction balance
    running_balance: number;
    notes?: string;
}

interface Entity {
    id: string;
    name: string;
    type: 'customer' | 'supplier';
    phone?: string;
    location?: string;
    outstanding_balance?: number;
}

interface EntityLedgerProps {
    entityId: string;
}

export default function EntityLedger({ entityId }: EntityLedgerProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [entity, setEntity] = useState<Entity | null>(null);
    const [ledger, setLedger] = useState<LedgerItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    useEffect(() => {
        if (searchParams.get('action') === 'payment') {
            setIsPaymentModalOpen(true);
        }
    }, [searchParams]);

    useEffect(() => {
        loadLedger();
    }, [entityId]);

    const loadLedger = async () => {
        setIsLoading(true);
        const result = await getEntityLedgerAction(entityId);
        if (result.success && result.data) {
            setEntity(result.data.entity);
            setLedger(result.data.ledger);
        } else {
            setError(result.error || "Failed to load ledger data");
        }
        setIsLoading(false);
    };

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Spinner size="lg" /></div>;
    }

    if (error || !entity) {
        return (
            <div className="flex h-96 flex-col items-center justify-center text-slate-400">
                <p>Failed to load ledger.</p>
                <button onClick={() => router.back()} className="mt-4 text-emerald-600 hover:underline">Go Back</button>
            </div>
        );
    }

    const currentBalance = ledger.length > 0 ? ledger[ledger.length - 1].running_balance : 0;
    const isPositiveBalance = currentBalance >= 0; // Positive means they owe us (Asset), assuming Customer context. 
    // Wait, let's verify context.
    // Customer: Sale (+) increases balance. Payment (-) decreases it. 
    // Positive balance = They owe us.
    // Supplier: Purchase (+) increases balance (Payable). Payment (-) decreases it.
    // Positive balance = We owe them.

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={() => router.back()}
                    className="flex w-fit items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-sm border border-slate-100 hover:bg-slate-50 hover:text-slate-800 transition-all"
                >
                    <ArrowLeft size={14} />
                    Back
                </button>

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 rounded-3xl bg-white p-6 md:p-8 shadow-sm border border-slate-100">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={cn(
                                "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                                entity.type === 'customer' ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                            )}>
                                {entity.type}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">#{entity.id.slice(0, 8)}</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">{entity.name}</h1>
                        <div className="flex flex-col gap-1 text-sm text-slate-500 font-medium">
                            <span className="flex items-center gap-2">
                                <FileText size={14} className="text-slate-400" /> {entity.phone || "No phone"}
                            </span>
                            <span className="flex items-center gap-2">
                                <FileText size={14} className="text-slate-400" /> {entity.location || "No location"}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col items-start md:items-end">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Current Balance</span>
                        <div className={cn(
                            "text-4xl font-black tracking-tight",
                            currentBalance > 0 ? "text-rose-600" : "text-emerald-600"
                        )}>
                            {formatCurrency(currentBalance)}
                        </div>
                        <p className="text-xs font-medium text-slate-400 mt-2 mb-4">
                            {currentBalance > 0
                                ? (entity.type === 'customer' ? "Customer owes you" : "You owe supplier")
                                : "No outstanding balance"
                            }
                        </p>

                        <button
                            onClick={() => setIsPaymentModalOpen(true)}
                            disabled={currentBalance <= 0}
                            className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Banknote size={18} />
                            Pay Outstanding
                        </button>
                    </div>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-lg">Transaction History</h3>
                    <button className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
                        <Filter size={16} />
                        Filter
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4 text-right">Debit / Credit</th>
                                <th className="px-6 py-4 text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {ledger.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                                        No transactions found.
                                    </td>
                                </tr>
                            ) : (
                                ledger.map((item) => {
                                    const isTransaction = item.item_type === 'transaction';
                                    const amount = isTransaction ? item.total_amount : item.amount;
                                    const isCredit = !isTransaction; // Simplification for visual: Sale/Purchase (Tx) vs Payment

                                    // Refined visual logic:
                                    // Transaction (Sale/Purchase) -> Increases debt (Red/Warning color?) or Neutral?
                                    // Payment -> Reduces debt (Green)

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    {new Date(item.created_at).toLocaleDateString(undefined, {
                                                        year: 'numeric', month: 'short', day: '2-digit'
                                                    })}
                                                </div>
                                                <div className="text-[10px] text-slate-400 pl-6">
                                                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">
                                                        {isTransaction
                                                            ? `${item.type === 'sale' ? 'Sale' : 'Purchase'} Invoice`
                                                            : 'Payment Received'
                                                        }
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        #{item.id.slice(0, 8)} • {item.notes || (isTransaction ? 'Transaction' : 'Payment')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isTransaction ? (
                                                        <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
                                                            {formatCurrency(amount || 0)}
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold flex items-center gap-1">
                                                            <ArrowDownLeft size={12} />
                                                            {formatCurrency(amount || 0)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <span className={cn(
                                                    "text-sm font-bold",
                                                    item.running_balance > 0 ? "text-slate-800" : "text-emerald-600"
                                                )}>
                                                    {formatCurrency(item.running_balance)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {entity && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => {
                        setIsPaymentModalOpen(false);
                        // Remove query param
                        router.replace(`/admin/${entity.type}s/${entity.id}`, { scroll: false });
                    }}
                    entityId={entity.id}
                    entityName={entity.name}
                    entityType={entity.type}
                    onSuccess={() => {
                        loadLedger();
                        // Ideally trigger a revalidation of the sidebar/header stats if needed
                    }}
                />
            )}
        </div>
    );
}
