import { getProductsAction, getEntitiesAction } from "@/app/actions";
import SalesEntryForm from "@/app/admin/sales/create/SalesEntryForm";
import { auth } from "@clerk/nextjs/server";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SalesmanCreateSalePage() {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as any)?.role;
    const branchId = (sessionClaims?.metadata as any)?.branch_id;

    if (role !== 'salesman') {
        redirect('/');
    }

    if (!branchId) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-4">
                    <AlertCircle size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Access Restricted</h2>
                <p className="text-slate-500 max-w-md mb-6">
                    You are not assigned to any branch. You cannot record sales until an administrator assigns you to a branch.
                </p>
                <Link
                    href="/salesman"
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                >
                    Return to Dashboard
                </Link>
            </div>
        );
    }

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
                    <p className="text-sm text-slate-500">Record a new sale for your branch.</p>
                </div>
            </div>

            <SalesEntryForm
                products={productsResult.data || []}
                customers={customersResult.data || []}
            />
        </div>
    );
}
