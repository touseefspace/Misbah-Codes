"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import CustomersTable from "@/components/entities/CustomersTable";
import EntityModal from "@/components/entities/EntityModal";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";
import { getEntitiesAction, upsertEntityAction, deleteEntityAction } from "@/app/actions";
import { toast } from "sonner";

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntity, setEditingEntity] = useState<any | null>(null);
    const [deletingEntity, setDeletingEntity] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
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
            setEditingEntity(null);
        } else {
            throw new Error(result.error);
        }
    };

    const handleDelete = async () => {
        if (!deletingEntity) return;
        setIsDeleting(true);
        try {
            const result = await deleteEntityAction(deletingEntity.id, 'customer');
            if (result.success) {
                toast.success("Customer deleted successfully");
                loadCustomers();
                setDeletingEntity(null);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to delete customer");
        } finally {
            setIsDeleting(false);
        }
    };

    const openNewModal = () => {
        setEditingEntity(null);
        setIsModalOpen(true);
    };

    const openEditModal = (entity: any) => {
        setEditingEntity(entity);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Customers</h1>
                    <p className="text-sm text-slate-500">View and manage your customer database.</p>
                </div>
                <button
                    onClick={openNewModal}
                    className="flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95 shadow-lg shadow-slate-200"
                >
                    <Plus size={18} />
                    New Customer
                </button>
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center text-slate-400 font-medium">Loading customers...</div>
            ) : (
                <CustomersTable
                    initialCustomers={customers}
                    onEdit={openEditModal}
                    onDelete={setDeletingEntity}
                />
            )}

            <EntityModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingEntity(null);
                }}
                onSave={handleSave}
                entity={editingEntity}
                type="customer"
            />

            <DeleteConfirmationModal
                isOpen={!!deletingEntity}
                onClose={() => setDeletingEntity(null)}
                onConfirm={handleDelete}
                title="Delete Customer"
                description={`Are you sure you want to delete "${deletingEntity?.name}"? This action cannot be undone.`}
                isDeleting={isDeleting}
            />
        </div>
    );
}
