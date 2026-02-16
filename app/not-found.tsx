"use client";

import { ArrowLeft, Home, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-slate-50 to-slate-100 p-8">
            <div className="flex flex-col items-center text-center max-w-md">
                {/* Icon */}
                <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-amber-50 text-amber-500 shadow-lg shadow-amber-100/50 border border-amber-100">
                    <AlertTriangle size={48} />
                </div>

                {/* Title */}
                <h1 className="mb-3 text-4xl font-black tracking-tight text-slate-900">
                    Page Not Found
                </h1>

                {/* Description */}
                <p className="mb-8 text-slate-500 leading-relaxed">
                    The page you're looking for doesn't exist or has been moved.
                    Check the URL or navigate back to continue.
                </p>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 shadow-sm"
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </button>
                    <Link
                        href="/"
                        className="flex h-12 items-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95 shadow-lg shadow-slate-200"
                    >
                        <Home size={18} />
                        Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
