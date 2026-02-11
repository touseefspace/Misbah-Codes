"use client";

import { cn } from "@/lib/utils";

interface SpinnerProps {
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    color?: "emerald" | "slate" | "white" | "rose";
    className?: string;
}

export default function Spinner({ size = "md", color = "emerald", className }: SpinnerProps) {
    const sizeClasses = {
        xs: "h-3 w-3 border-[1.5px]",
        sm: "h-4 w-4 border-2",
        md: "h-6 w-6 border-2",
        lg: "h-10 w-10 border-3",
        xl: "h-14 w-14 border-4",
    };

    const colorClasses = {
        emerald: "border-emerald-500/20 border-t-emerald-600",
        slate: "border-slate-200 border-t-slate-600",
        rose: "border-rose-200 border-t-rose-600",
        white: "border-white/20 border-t-white",
    };

    return (
        <div
            className={cn(
                "animate-spin rounded-full",
                sizeClasses[size],
                colorClasses[color],
                className
            )}
        />
    );
}
