"use client";

import { useState } from "react";
import {
    CheckCircle2,
    XCircle,
    ShieldCheck,
    User as UserIcon,
    MoreVertical
} from "lucide-react";
import { updateUserStatusAction } from "@/app/actions";
import { assignBranchToUserAction } from "@/app/actions/branch-actions";
import { cn } from "@/lib/utils";
import DataTable from "@/components/ui/DataTable";
import { toast } from "sonner";
import Spinner from "@/components/ui/Spinner";

interface User {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    is_approved: boolean;
    branch_id: string | null;
    created_at: string;
}

interface UsersTableProps {
    initialUsers: User[];
    branches: { id: string; name: string }[];
}

export default function UsersTable({ initialUsers, branches }: UsersTableProps) {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const handleUpdateUser = async (targetUserId: string, updates: Partial<User>) => {
        setIsUpdating(targetUserId);
        try {
            const result = await updateUserStatusAction(targetUserId, updates);
            if (result.success) {
                setUsers(prev => prev.map(u =>
                    u.id === targetUserId ? { ...u, ...updates } : u
                ));
                toast.success("User updated successfully");
            } else {
                toast.error(result.error || "Failed to update user");
            }
        } catch (err) {
            console.error(err);
            toast.error("An unexpected error occurred");
        } finally {
            setIsUpdating(null);
        }
    };

    const handleBranchUpdate = async (targetUserId: string, branchId: string | null) => {
        setIsUpdating(targetUserId);
        try {
            const result = await assignBranchToUserAction(targetUserId, branchId);
            if (result.success) {
                setUsers(prev => prev.map(u =>
                    u.id === targetUserId ? { ...u, branch_id: branchId } : u
                ));
                toast.success("Branch assigned successfully");
            } else {
                toast.error(result.error || "Failed to update branch");
            }
        } catch (err) {
            console.error(err);
            toast.error("An unexpected error occurred");
        } finally {
            setIsUpdating(null);
        }
    };

    const columns = [
        {
            header: "User",
            accessor: (user: User) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 font-bold border border-slate-100 italic">
                        {user.full_name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 tracking-tight">{user.full_name || "Unknown"}</span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{user.email}</span>
                    </div>
                </div>
            )
        },
        {
            header: "Role",
            accessor: (user: User) => (
                <div className="flex items-center gap-2">
                    <select
                        value={user.role}
                        onChange={(e) => handleUpdateUser(user.id, { role: e.target.value })}
                        disabled={isUpdating === user.id}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-50 shadow-sm"
                    >
                        <option value="pending">Pending</option>
                        <option value="salesman">Salesman</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            )
        },
        {
            header: "Status",
            accessor: (user: User) => (
                <div className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border shadow-sm",
                    user.is_approved
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-amber-50 text-amber-700 border-amber-100"
                )}>
                    {user.is_approved ? (
                        <>
                            <ShieldCheck size={12} className="stroke-3" />
                            Approved
                        </>
                    ) : (
                        <>
                            <XCircle size={12} className="stroke-3" />
                            Pending
                        </>
                    )}
                </div>
            )
        },
        {
            header: "Branch",
            accessor: (user: User) => (
                <div className="flex items-center gap-2">
                    <select
                        value={user.branch_id || ""}
                        onChange={(e) => handleBranchUpdate(user.id, e.target.value || null)}
                        disabled={isUpdating === user.id}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-50 shadow-sm"
                    >
                        <option value="">No Branch</option>
                        {branches.map(branch => (
                            <option key={branch.id} value={branch.id}>
                                {branch.name}
                            </option>
                        ))}
                    </select>
                </div>
            )
        },
        {
            header: "Joined",
            accessor: (user: User) => (
                <span className="text-xs font-semibold text-slate-500">
                    {new Date(user.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
            )
        }
    ];

    const actions = (user: User) => (
        <div className="flex items-center justify-end gap-2">
            {!user.is_approved ? (
                <button
                    onClick={() => handleUpdateUser(user.id, { is_approved: true, role: user.role === 'pending' ? 'salesman' : user.role })}
                    disabled={isUpdating === user.id}
                    className="flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50 shadow-md shadow-emerald-600/20"
                >
                    {isUpdating === user.id ? (
                        <Spinner size="xs" color="white" />
                    ) : (
                        <CheckCircle2 size={14} className="stroke-3" />
                    )}
                    {isUpdating === user.id ? "Syncing..." : "Approve"}
                </button>
            ) : (
                <button
                    onClick={() => handleUpdateUser(user.id, { is_approved: false })}
                    disabled={isUpdating === user.id}
                    className="flex h-9 items-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50 px-4 text-[10px] font-black uppercase tracking-widest text-rose-600 transition-all hover:bg-rose-100 active:scale-95 disabled:opacity-50 shadow-sm"
                >
                    {isUpdating === user.id ? (
                        <Spinner size="xs" color="rose" />
                    ) : (
                        <XCircle size={14} className="stroke-3" />
                    )}
                    {isUpdating === user.id ? "Syncing..." : "Revoke"}
                </button>
            )}
        </div>
    );

    return (
        <DataTable
            data={users}
            columns={columns}
            actions={actions}
            searchPlaceholder="Search users by name or email..."
        />
    );
}
