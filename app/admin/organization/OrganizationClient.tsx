"use client";

import { useState } from "react";
import { Users, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import UsersTable from "../users/UsersTable";
import BranchesClient from "../branches/BranchesClient";

interface User {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    is_approved: boolean;
    branch_id: string | null;
    created_at: string;
}

interface Branch {
    id: string;
    name: string;
    location: string | null;
    is_admin_branch: boolean;
    created_at: string;
}

interface OrganizationClientProps {
    initialUsers: User[];
    initialBranches: Branch[];
}

type Tab = 'users' | 'branches';

export default function OrganizationClient({ initialUsers, initialBranches }: OrganizationClientProps) {
    const [activeTab, setActiveTab] = useState<Tab>('users');

    const tabs = [
        { id: 'users' as Tab, label: 'Users', icon: Users, count: initialUsers.length },
        { id: 'branches' as Tab, label: 'Branches', icon: Store, count: initialBranches.length },
    ];

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200",
                            activeTab === tab.id
                                ? "bg-white text-slate-800 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                        <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-black",
                            activeTab === tab.id
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-500"
                        )}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'users' && (
                    <UsersTable
                        initialUsers={initialUsers}
                        branches={initialBranches.map(b => ({ id: b.id, name: b.name }))}
                    />
                )}
                {activeTab === 'branches' && (
                    <BranchesClient initialBranches={initialBranches} />
                )}
            </div>
        </div>
    );
}
