"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Package,
    ShoppingCart,
    Truck,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Store,
    Contact,
    Building2,
    Send,
    Warehouse
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils"; // Assuming a utility exists or I'll create it
import { SignOutButton, useClerk } from "@clerk/nextjs";

interface SidebarProps {
    role: 'admin' | 'salesman';
    isOpen?: boolean;
    onClose?: () => void;
}

const adminLinks = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Organization", href: "/admin/organization", icon: Building2 },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Customers", href: "/admin/customers", icon: Contact },
    { name: "Suppliers", href: "/admin/suppliers", icon: Store },
    { name: "Inventory", href: "/admin/inventory", icon: Warehouse },
    { name: "Sales", href: "/admin/sales", icon: ShoppingCart },
    { name: "Purchases", href: "/admin/purchases", icon: Truck },
    { name: "Transfers", href: "/admin/transfers", icon: Send },
];

const salesmanLinks = [
    { name: "Dashboard", href: "/salesman/dashboard", icon: LayoutDashboard },
    { name: "Inventory", href: "/salesman/inventory", icon: Package },
    { name: "Transfers", href: "/salesman/transfers", icon: Send },
    { name: "Customers", href: "/salesman/customers", icon: Contact },
    { name: "Sales", href: "/salesman/sales", icon: ShoppingCart },
];

export default function Sidebar({ role, isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const links = role === 'admin' ? adminLinks : salesmanLinks;

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={onClose}
                />
            )}

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out lg:relative lg:translate-x-0",
                    isCollapsed ? "w-20" : "w-64",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Logo Section */}
                <div className="flex h-20 items-center border-b border-slate-100 px-6">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-200">
                            <Store size={22} />
                        </div>
                        {!isCollapsed && (
                            <span className="whitespace-nowrap text-lg font-bold tracking-tight text-slate-800">
                                Misbah <span className="text-emerald-600">Fruits</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
                    {links.map((link) => {
                        const isActive = pathname.startsWith(link.href);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 group",
                                    isActive
                                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                )}
                            >
                                <link.icon
                                    size={22}
                                    className={cn(
                                        "shrink-0 transition-colors",
                                        isActive ? "text-emerald-600" : "group-hover:text-slate-800"
                                    )}
                                />
                                {!isCollapsed && (
                                    <span className="whitespace-nowrap text-sm">{link.name}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-24 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:text-slate-600"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* Bottom Section */}
                <div className="border-t border-slate-100 p-4">
                    <SignOutButton>
                        <button className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-slate-500 transition-all hover:bg-red-50 hover:text-red-600",
                            isCollapsed && "justify-center px-0"
                        )}>
                            <LogOut size={22} className="shrink-0" />
                            {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
                        </button>
                    </SignOutButton>
                </div>
            </aside>
        </>
    );
}
