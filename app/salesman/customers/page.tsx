"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import CustomersTable from "@/components/entities/CustomersTable";
import EntityModal from "@/components/entities/EntityModal";
import { getEntitiesAction, upsertEntityAction } from "@/app/actions";

export default function SalesmanCustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        setIsLoading(true);
        const { data } = await getEntitiesAction('customer');
        setCustomers(data || []);
        setIsLoading(false);
    };

    const handleSave = async (formData: any) => {
        const result = await upsertEntityAction(formData);
        if (result.success) {
            loadCustomers();
        } else {
            throw new Error(result.error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Customers</h1>
                    <p className="text-sm text-slate-500">Your customer contact list and records.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95 shadow-lg shadow-slate-200"
                >
                    <Plus size={18} />
                    New Customer
                </button>
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center text-slate-400 font-medium">Loading customers...</div>
            ) : (
                <CustomersTable initialCustomers={customers} />
            )}

            <EntityModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                entity={null}
                type="customer"
            />
        </div>
    );
}
