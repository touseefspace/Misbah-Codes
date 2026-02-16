"use client";

import { useState, useEffect, useMemo } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { X, Calculator, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { getUnpaidTransactionsAction, processPaymentAction, UnpaidTransaction } from "@/app/actions/payments";
import { toast } from "sonner";
import Spinner from "@/components/ui/Spinner";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    entityId: string;
    entityName: string;
    entityType: 'customer' | 'supplier';
    onSuccess: () => void;
}

export default function PaymentModal({
    isOpen,
    onClose,
    entityId,
    entityName,
    entityType,
    onSuccess
}: PaymentModalProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [loadingData, setLoadingData] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [transactions, setTransactions] = useState<UnpaidTransaction[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<string>('');

    // Load unpaid transactions when modal opens
    useEffect(() => {
        if (isOpen) {
            loadTransactions();
            setStep(1);
            setPaymentAmount('');
            setError(null);
        }
    }, [isOpen, entityId]);

    const loadTransactions = async () => {
        setLoadingData(true);
        // Determine transaction type: Supplier Payment -> pays off Purchases. Customer Payment -> pays off Sales.
        const txType = entityType === 'supplier' ? 'purchase' : 'sale';

        const result = await getUnpaidTransactionsAction(entityId, txType);
        if (result.success && result.data) {
            setTransactions(result.data);
        } else {
            setError(result.error || "Failed to load outstanding invoices.");
        }
        setLoadingData(false);
    };

    // Calculate FIFO Allocation
    const allocation = useMemo(() => {
        const amount = parseFloat(paymentAmount) || 0;
        let remaining = amount;

        return transactions.map(tx => {
            const balance = Number(tx.balance);
            const allocated = Math.min(balance, remaining);
            remaining = Math.max(0, remaining - allocated);

            return {
                ...tx,
                allocated,
                remainingBalance: balance - allocated,
                fullyPaid: allocated >= balance - 0.01 // tolerance
            };
        });
    }, [transactions, paymentAmount]);

    const totalOutstanding = transactions.reduce((sum, tx) => sum + Number(tx.balance), 0);
    const currentAmount = parseFloat(paymentAmount) || 0;
    const isValidAmount = currentAmount > 0 && currentAmount <= totalOutstanding;

    const handleNext = () => {
        if (!isValidAmount) return;
        setStep(2);
    };

    const handleConfirm = async () => {
        setSubmitting(true);
        try {
            const txType = entityType === 'supplier' ? 'purchase' : 'sale';
            const result = await processPaymentAction({
                entityId,
                amount: currentAmount,
                type: txType
            });

            if (result.success) {
                toast.success("Payment recorded successfully");
                onSuccess();
                onClose();
            } else {
                toast.error(result.error || "Failed to record payment");
                // Don't close, let them try again or fix
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Record Payment</h2>
                        <p className="text-xs text-slate-500 font-medium">
                            {entityType === 'supplier' ? 'Pay' : 'Receive from'} <span className="text-slate-700 font-bold">{entityName}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {loadingData ? (
                    <div className="flex h-64 items-center justify-center">
                        <Spinner />
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                            <AlertCircle size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Error Loading Data</h3>
                        <p className="text-sm text-slate-500 mt-1">{error}</p>
                        <button onClick={onClose} className="mt-6 px-4 py-2 bg-slate-100 font-bold text-slate-600 rounded-lg hover:bg-slate-200">
                            Close
                        </button>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <CheckCircle2 size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">All Settled!</h3>
                        <p className="text-sm text-slate-500 mt-1">There are no outstanding invoices for this {entityType}.</p>
                        <button onClick={onClose} className="mt-6 px-4 py-2 bg-slate-900 font-bold text-white rounded-lg hover:bg-slate-800">
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6">

                            {step === 1 && (
                                <div className="space-y-6">
                                    {/* Amount Logic */}
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="mb-2 flex justify-between">
                                            <label className="text-sm font-bold text-slate-700">Payment Amount</label>
                                            <span className="text-xs font-bold text-slate-400">
                                                Total Outstanding: <span className="text-rose-600">{formatCurrency(totalOutstanding)}</span>
                                            </span>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                <DollarSignIcon size={18} />
                                            </div>
                                            <input
                                                type="number"
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                placeholder="0.00"
                                                className={cn(
                                                    "w-full rounded-xl border-2 bg-white pl-10 pr-4 py-3 text-lg font-bold text-slate-800 outline-none transition-all placeholder:text-slate-300",
                                                    currentAmount > totalOutstanding ? "border-rose-300 focus:border-rose-500" : "border-slate-200 focus:border-slate-900"
                                                )}
                                                autoFocus
                                            />
                                        </div>
                                        {currentAmount > totalOutstanding && (
                                            <p className="mt-2 text-xs font-bold text-rose-500 flex items-center gap-1">
                                                <AlertCircle size={12} />
                                                Amount cannot exceed total outstanding balance.
                                            </p>
                                        )}
                                    </div>

                                    {/* Allocation Preview Table */}
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Allocation Preview (FIFO)</h4>
                                        <div className="rounded-xl border border-slate-100 overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                                                    <tr>
                                                        <th className="px-4 py-3">Date</th>
                                                        <th className="px-4 py-3">Invoice</th>
                                                        <th className="px-4 py-3 text-right">Balance</th>
                                                        <th className="px-4 py-3 text-right text-emerald-600">Paying</th>
                                                        <th className="px-4 py-3 text-right">Remaining</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {allocation.map((tx) => (
                                                        <tr key={tx.id} className={cn("transition-colors", tx.allocated > 0 ? "bg-emerald-50/30" : "")}>
                                                            <td className="px-4 py-3 text-slate-600">
                                                                {new Date(tx.created_at).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-4 py-3 font-medium text-slate-700">
                                                                #{tx.id.slice(0, 8)}
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-slate-600">
                                                                {formatCurrency(Number(tx.balance))}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-bold text-emerald-600">
                                                                {tx.allocated > 0 ? formatCurrency(tx.allocated) : "-"}
                                                            </td>
                                                            <td className={cn(
                                                                "px-4 py-3 text-right font-medium",
                                                                tx.remainingBalance === 0 ? "text-slate-300 decoration-slate-300" : "text-slate-600"
                                                            )}>
                                                                {tx.remainingBalance === 0 ? (
                                                                    <span className="flex items-center justify-end gap-1 text-xs text-emerald-600 font-bold">
                                                                        <CheckCircle2 size={12} /> Paid
                                                                    </span>
                                                                ) : (
                                                                    formatCurrency(tx.remainingBalance)
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6">
                                    <div className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Total Payment</span>
                                        <div className="text-4xl font-black text-slate-800 tracking-tight mb-1">
                                            {formatCurrency(currentAmount)}
                                        </div>
                                        <p className="text-sm text-slate-500 font-medium">
                                            Allocating via FIFO to oldest invoices first
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <SummaryRow
                                            label="Invoices Fully Cleared"
                                            value={allocation.filter(a => a.fullyPaid && a.allocated > 0).length.toString()}
                                            icon={<CheckCircle2 size={16} className="text-emerald-500" />}
                                        />
                                        <SummaryRow
                                            label="Invoices Partially Paid"
                                            value={allocation.filter(a => !a.fullyPaid && a.allocated > 0).length.toString()}
                                            icon={<Calculator size={16} className="text-orange-500" />}
                                        />
                                        <div className="h-px bg-slate-100 my-2" />
                                        <SummaryRow
                                            label="Remaining Outstanding Balance"
                                            value={formatCurrency(totalOutstanding - currentAmount)}
                                            highlight
                                        />
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Footer - Actions */}
                        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between gap-4">
                            {step === 1 ? (
                                <>
                                    <div className="text-xs font-bold text-slate-400">
                                        {allocation.filter(a => a.allocated > 0).length} invoices selected
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={onClose}
                                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            disabled={!isValidAmount}
                                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                        >
                                            Next Step
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                                        disabled={submitting}
                                    >
                                        Back to Edit
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={submitting}
                                        className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-95"
                                    >
                                        {submitting ? (
                                            <>
                                                <Spinner size="sm" className="text-white" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Confirm Payment
                                                <CheckCircle2 size={16} />
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function DollarSignIcon({ size }: { size: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="12" x2="12" y1="2" y2="22" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    )
}

function SummaryRow({ label, value, icon, highlight }: { label: string, value: string, icon?: React.ReactNode, highlight?: boolean }) {
    return (
        <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                {icon}
                {label}
            </div>
            <span className={cn(
                "text-base font-bold",
                highlight ? "text-slate-800" : "text-slate-700"
            )}>
                {value}
            </span>
        </div>
    );
}
