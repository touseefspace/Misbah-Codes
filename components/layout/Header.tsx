"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Bell, Search, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import BackButton from "@/components/ui/BackButton";

interface HeaderProps {
    onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { user } = useUser();
    const pathname = usePathname();

    // Map pathname to a readable title
    const getPageTitle = (path: string) => {
        const parts = path.split('/').filter(Boolean);
        if (parts.length === 0) return "Dashboard";
        const lastPart = parts[parts.length - 1];
        return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
    };

    return (
        <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-white/20 bg-white/70 px-4 sm:px-8 backdrop-blur-md">
            {/* Left Section: Title & Back Button */}
            <div className="flex items-center gap-3 sm:gap-4">
                <button
                    onClick={onMenuClick}
                    className="flex lg:hidden h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500"
                >
                    <Menu size={20} />
                </button>
                <div className="hidden xs:block">
                    <BackButton />
                </div>
                <div>
                    <h2 className="text-sm sm:text-lg font-bold tracking-tight text-slate-800 line-clamp-1">
                        {getPageTitle(pathname)}
                    </h2>
                    <p className="text-[10px] font-medium text-slate-400">
                        Hi, {user?.firstName || 'User'}
                    </p>
                </div>
            </div>

            {/* Middle Section: Search (Optional) */}
            <div className="hidden max-w-md flex-1 md:flex px-10">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search records..."
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                </div>
            </div>

            {/* Right Section: Profile & Actions */}
            <div className="flex items-center gap-4">
                <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 transition-colors hover:bg-slate-100 text-slate-500">
                    <Bell size={20} />
                    <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                </button>

                <div className="h-8 w-px bg-slate-200"></div>

                <div className="flex items-center gap-3">
                    <div className="hidden flex-col items-end sm:flex text-right">
                        <span className="text-sm font-semibold text-slate-800">
                            {user?.fullName}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                            {(user?.publicMetadata?.role as string) || 'Personnel'}
                        </span>
                    </div>
                    <div className="rounded-xl border-2 border-slate-50 p-0.5 transition-transform hover:scale-110">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </div>
        </header>
    );
}
