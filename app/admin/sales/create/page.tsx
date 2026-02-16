import { getProductsAction, getEntitiesAction } from "@/app/actions";
import SalesEntryForm from "./SalesEntryForm";
import { auth } from "@clerk/nextjs/server";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function CreateSalePage() {
    const [productsResult, customersResult] = await Promise.all([
        getProductsAction(),
        getEntitiesAction('customer')
    ]);

    if (productsResult.error || customersResult.error) {
        return <div className="p-8 text-red-500 font-bold">Error loading form data.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">New Sales Transaction</h1>
                    <p className="text-sm text-slate-500">Record a new sale and update inventory automatically.</p>
                </div>
            </div>

            <SalesEntryForm
                products={productsResult.data || []}
                customers={customersResult.data || []}
            />
        </div>
    );
}
