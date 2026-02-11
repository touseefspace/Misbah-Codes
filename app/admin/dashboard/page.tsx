import { getDashboardStatsAction } from "@/app/actions";
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    ShoppingCart,
    Package,
    Scale
} from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AdminDashboard() {
    const { data: stats, error } = await getDashboardStatsAction();

    if (error) {
        return <div className="p-8 text-red-500">Error loading dashboard: {error}</div>;
    }

    const cards = [
        {
            title: "Total Sales Today",
            value: `AED ${stats.total_sales_today?.toLocaleString()}`,
            icon: ShoppingCart,
            color: "emerald",
            trend: "+12.5%", // Placeholder trend
        },
        {
            title: "Total Purchases Today",
            value: `AED ${stats.total_purchases_today?.toLocaleString()}`,
            icon: TrendingDown,
            color: "amber",
            trend: "-2.4%",
        },
        {
            title: "Inventory Value",
            value: `AED ${stats.inventory_value?.toLocaleString()}`,
            icon: Package,
            color: "blue",
        },
        {
            title: "Receivables",
            value: `AED ${stats.receivables?.toLocaleString()}`,
            icon: Wallet,
            color: "rose",
        },
        {
            title: "Payables",
            value: `AED ${stats.payables?.toLocaleString()}`,
            icon: Scale,
            color: "indigo",
        },
        {
            title: "Pending Transfers",
            value: stats.pending_transfers,
            icon: TrendingUp,
            color: "orange",
        }
    ];

    return (
        <div className="space-y-8">
            {/* Header / Summary Section */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800">Operational Overview</h1>
                <p className="text-sm text-slate-500">Real-time stats from across your branches.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((card, idx) => (
                    <div
                        key={idx}
                        className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200"
                    >
                        <div className="flex items-center justify-between">
                            <div className={cn(
                                "flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110",
                                card.color === 'emerald' && "bg-emerald-50 text-emerald-600",
                                card.color === 'amber' && "bg-amber-50 text-amber-600",
                                card.color === 'blue' && "bg-blue-50 text-blue-600",
                                card.color === 'rose' && "bg-rose-50 text-rose-600",
                                card.color === 'indigo' && "bg-indigo-50 text-indigo-600",
                                card.color === 'orange' && "bg-orange-50 text-orange-600",
                            )}>
                                <card.icon size={24} />
                            </div>
                            {card.trend && (
                                <span className={cn(
                                    "text-xs font-bold",
                                    card.trend.startsWith('+') ? "text-emerald-500" : "text-rose-500"
                                )}>
                                    {card.trend}
                                </span>
                            )}
                        </div>

                        <div className="mt-4">
                            <p className="text-sm font-medium text-slate-400">{card.title}</p>
                            <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
                                {card.value}
                            </h3>
                        </div>

                        {/* Subtle background decoration */}
                        <div className={cn(
                            "absolute -right-4 -bottom-4 h-24 w-24 rounded-full opacity-[0.03]",
                            card.color === 'emerald' && "bg-emerald-600",
                            card.color === 'amber' && "bg-amber-600",
                        )}></div>
                    </div>
                ))}
            </div>

            {/* Empty states for charts/tables */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
                    <p className="text-sm font-medium text-slate-400 italic">Sales Trend Chart (Coming Soon)</p>
                </div>
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
                    <p className="text-sm font-medium text-slate-400 italic">Top Products (Coming Soon)</p>
                </div>
            </div>
        </div>
    );
}
