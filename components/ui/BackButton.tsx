"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
    className?: string;
}

export default function BackButton({ className }: BackButtonProps) {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            className={cn(
                "group flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-emerald-500 hover:text-emerald-600 active:scale-95",
                className
            )}
            title="Go Back"
        >
            <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-0.5" />
        </button>
    );
}
