"use client";

import { cn } from "@/lib/utils";
import {
    ChevronDown,
    ChevronUp,
    MoreHorizontal,
    Search,
    Filter
} from "lucide-react";
import { useState } from "react";
import RefreshButton from "@/components/ui/RefreshButton";

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    searchPlaceholder?: string;
    onRowClick?: (item: T) => void;
    actions?: (item: T) => React.ReactNode;
}

export default function DataTable<T extends { id: string | number }>({
    data,
    columns,
    searchPlaceholder = "Search...",
    onRowClick,
    actions
}: DataTableProps<T>) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);

    // Filtering logic
    const filteredData = data.filter((item) => {
        return Object.values(item).some((value) =>
            String(value).toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    // Sorting logic (Basic)
    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className="flex flex-col gap-4">
            {/* Table Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 px-1">
                <div className="relative flex-1 sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <RefreshButton />
                    <button className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 active:scale-95">
                        <Filter size={18} />
                        Filters
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                {columns.map((column, idx) => (
                                    <th
                                        key={idx}
                                        className={cn(
                                            "px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500",
                                            column.className
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            {column.header}
                                            {typeof column.accessor === 'string' && (
                                                <button className="text-slate-300 hover:text-slate-500">
                                                    <ChevronDown size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </th>
                                ))}
                                {actions && (
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedData.length > 0 ? (
                                sortedData.map((item) => (
                                    <tr
                                        key={item.id}
                                        onClick={() => onRowClick?.(item)}
                                        className={cn(
                                            "transition-colors hover:bg-slate-50/80",
                                            onRowClick && "cursor-pointer"
                                        )}
                                    >
                                        {columns.map((column, idx) => (
                                            <td key={idx} className={cn("px-6 py-4 text-sm text-slate-600", column.className)}>
                                                {typeof column.accessor === 'function'
                                                    ? column.accessor(item)
                                                    : (item[column.accessor] as React.ReactNode)
                                                }
                                            </td>
                                        ))}
                                        {actions && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {actions(item)}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={columns.length + (actions ? 1 : 0)}
                                        className="px-6 py-12 text-center text-sm text-slate-400"
                                    >
                                        No records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Placeholder */}
            <div className="flex items-center justify-between px-2 text-xs text-slate-400">
                <span>Showing {sortedData.length} records</span>
                <div className="flex gap-2">
                    <button className="rounded-lg border border-slate-100 px-3 py-1 hover:bg-white disabled:opacity-50" disabled>Previous</button>
                    <button className="rounded-lg border border-slate-100 px-3 py-1 hover:bg-white disabled:opacity-50" disabled>Next</button>
                </div>
            </div>
        </div>
    );
}
