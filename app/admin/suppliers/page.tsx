"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import SuppliersTable from "./SuppliersTable";
import EntityModal from "@/components/entities/EntityModal";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";
import { getEntitiesAction, upsertEntityAction, deleteEntityAction } from "@/app/actions";
import { toast } from "sonner";

export default function AdminSuppliersPage() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntity, setEditingEntity] = useState<any | null>(null);
    const [deletingEntity, setDeletingEntity] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
        setIsLoading(true);
        const { data } = await getEntitiesAction('supplier');
        setSuppliers(data || []);
        setIsLoading(false);
    };

    const handleSave = async (formData: any) => {
        const result = await upsertEntityAction(formData);
        if (result.success) {
            loadSuppliers();
            setEditingEntity(null);
        } else {
            throw new Error(result.error);
        }
    };

    const handleDelete = async () => {
        if (!deletingEntity) return;
        setIsDeleting(true);
        try {
            const result = await deleteEntityAction(deletingEntity.id, 'supplier');
            if (result.success) {
                toast.success("Supplier deleted successfully");
                loadSuppliers();
                setDeletingEntity(null);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to delete supplier");
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
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Suppliers</h1>
                    <p className="text-sm text-slate-500">Manage your fruit and vegetable procurement sources.</p>
                </div>
                <button
                    onClick={openNewModal}
                    className="flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95 shadow-lg shadow-slate-200"
                >
                    <Plus size={18} />
                    New Supplier
                </button>
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center text-slate-400 font-medium">Loading suppliers...</div>
            ) : (
                <SuppliersTable
                    initialSuppliers={suppliers}
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
                type="supplier"
            />

            <DeleteConfirmationModal
                isOpen={!!deletingEntity}
                onClose={() => setDeletingEntity(null)}
                onConfirm={handleDelete}
                title="Delete Supplier"
                description={`Are you sure you want to delete "${deletingEntity?.name}"? This action cannot be undone.`}
                isDeleting={isDeleting}
            />
        </div>
    );
}
