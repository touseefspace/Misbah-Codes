"use client";

import { useState } from "react";
import { UserButton, useUser, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";

export default function PendingApproval() {
    const { user } = useUser();
    const { signOut } = useClerk();
    const router = useRouter();
    const [showDebug, setShowDebug] = useState(false);

    // Zustand Store
    const { isSyncing, error, syncStatus } = useAuthStore();

    const handleManualSync = async () => {
        if (!user) return;

        const approved = await syncStatus();

        if (approved) {
            // Approval detected and Clerk metadata synced via server action
            console.log('✨ Approved! Performing final session reload...');
            await user.reload();
            // 1s delay to let everything settle
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Hard reload to get fresh JWT
            window.location.href = "/dashboard";
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 font-sans text-slate-900">
            <div className="absolute top-0 left-0 h-full w-full overflow-hidden z-0">
                <div className="absolute -top-24 -left-20 h-96 w-96 rounded-full bg-emerald-100/50 blur-3xl opacity-60"></div>
                <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-amber-100/50 blur-3xl opacity-60"></div>
            </div>

            <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-10 shadow-2xl shadow-slate-200 text-center">
                <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100 transition-transform hover:scale-110">
                    {isSyncing ? (
                        <div className="relative h-10 w-10">
                            <div className="absolute h-10 w-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin"></div>
                        </div>
                    ) : (
                        <svg className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </div>

                <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900">
                    Approval Pending
                </h1>

                <p className="mb-8 text-lg leading-relaxed text-slate-600">
                    Your account has been created! An administrator needs to approve your access before you can use the system.
                </p>

                <div className="space-y-4">
                    <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-sm text-slate-500 flex items-center justify-between">
                        <div className="flex flex-col items-start">
                            <span className="font-medium text-slate-700">Signed in as</span>
                            <span className="truncate max-w-[180px]">{user?.primaryEmailAddress?.emailAddress}</span>
                        </div>
                        <UserButton afterSignOutUrl="/" />
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleManualSync}
                            disabled={isSyncing}
                            className="flex h-12 items-center justify-center rounded-xl bg-emerald-600 px-6 font-semibold text-white transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                        >
                            {isSyncing ? "Checking..." : "Sync & Check Approval"}
                        </button>

                        {error && (
                            <p className="text-sm font-medium text-red-500">
                                {error}
                            </p>
                        )}

                        <Link
                            href="/"
                            className="flex h-12 items-center justify-center rounded-xl bg-slate-900 px-6 font-semibold text-white transition-all hover:bg-slate-800 active:scale-95"
                        >
                            Return Home
                        </Link>

                        <button
                            onClick={() => signOut(() => router.push("/"))}
                            className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                        >
                            Sign Out
                        </button>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <button
                            onClick={() => setShowDebug(!showDebug)}
                            className="text-xs text-slate-400 hover:text-slate-600 underline"
                        >
                            {showDebug ? "Hide Session Info" : "Show Session Info (Debug)"}
                        </button>

                        {showDebug && (
                            <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-left overflow-auto max-h-40">
                                <pre className="text-[10px] text-slate-500 font-mono">
                                    {JSON.stringify({
                                        id: user?.id,
                                        metadata: user?.publicMetadata,
                                        lastUpdated: new Date().toLocaleTimeString()
                                    }, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
