"use client";

import { useState } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    Package
} from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import ProductModal from "./ProductModal";
import { deleteProductAction } from "@/app/actions";
import { toast } from "sonner";
import Spinner from "@/components/ui/Spinner";

interface Product {
    id: string;
    name: string;
    description: string | null;
    cost_price_carton: number;
    selling_price_carton: number;
    cost_price_tray: number;
    selling_price_tray: number;
    cost_price_kg: number;
    selling_price_kg: number;
}

interface ProductsTableProps {
    initialProducts: Product[];
}

export default function ProductsTable({ initialProducts }: ProductsTableProps) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        setIsDeleting(id);
        const result = await deleteProductAction(id);
        if (result.success) {
            setProducts(prev => prev.filter(p => p.id !== id));
            toast.success("Product deleted successfully");
        } else {
            toast.error(result.error || "Failed to delete product");
        }
        setIsDeleting(null);
    };

    const handleSave = (product: Product) => {
        if (editingProduct) {
            setProducts(prev => prev.map(p => p.id === product.id ? product : p));
        } else {
            setProducts(prev => [product, ...prev]);
        }
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const columns = [
        {
            header: "Product",
            accessor: (p: Product) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 font-bold border border-slate-100 italic">
                        {p.name?.[0]?.toUpperCase() || "P"}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 tracking-tight">{p.name}</span>
                        <span className="max-w-[200px] truncate text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            {p.description || "No specific details"}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: "Price (Carton)",
            accessor: (p: Product) => (
                <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-800 leading-tight">AED {p.selling_price_carton.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cost: AED {p.cost_price_carton.toLocaleString()}</span>
                </div>
            )
        },
        {
            header: "Price (Tray)",
            accessor: (p: Product) => (
                <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-800 leading-tight">AED {p.selling_price_tray.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cost: AED {p.cost_price_tray.toLocaleString()}</span>
                </div>
            )
        },
        {
            header: "Price (KG)",
            accessor: (p: Product) => (
                <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-800 leading-tight">AED {p.selling_price_kg.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cost: AED {p.cost_price_kg.toLocaleString()}</span>
                </div>
            )
        }
    ];

    const actions = (p: Product) => (
        <div className="flex items-center justify-end gap-2">
            <button
                onClick={() => {
                    setEditingProduct(p);
                    setIsModalOpen(true);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-800 active:scale-95 shadow-sm"
            >
                <Pencil size={14} className="stroke-2" />
            </button>
            <button
                onClick={() => handleDelete(p.id)}
                disabled={isDeleting === p.id}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-400 transition-all hover:bg-rose-100 hover:text-rose-600 active:scale-95 shadow-sm disabled:opacity-50"
            >
                {isDeleting === p.id ? (
                    <Spinner size="xs" color="rose" />
                ) : (
                    <Trash2 size={14} className="stroke-2" />
                )}
            </button>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Product Catalog</h1>
                    <p className="text-sm text-slate-500">Manage your fruits, vegetables, and pricing.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingProduct(null);
                        setIsModalOpen(true);
                    }}
                    className="flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95 shadow-lg shadow-slate-200"
                >
                    <Plus size={18} className="stroke-3" />
                    New Product
                </button>
            </div>

            <DataTable
                data={products}
                columns={columns}
                actions={actions}
                searchPlaceholder="Search products by name..."
            />

            {isModalOpen && (
                <ProductModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingProduct(null);
                    }}
                    onSave={handleSave}
                    product={editingProduct}
                />
            )}
        </div>
    );
}
