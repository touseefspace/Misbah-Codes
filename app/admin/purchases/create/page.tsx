import { getProductsAction, getEntitiesAction } from "@/app/actions";
import PurchaseEntryForm from "./PurchaseEntryForm";

export default async function CreatePurchasePage() {
    const [productsResult, suppliersResult] = await Promise.all([
        getProductsAction(),
        getEntitiesAction('supplier')
    ]);

    if (productsResult.error || suppliersResult.error) {
        return <div className="p-8 text-red-500 font-bold">Error loading form data.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">New Purchase Transaction</h1>
                    <p className="text-sm text-slate-500">Log incoming stock from suppliers and update inventory.</p>
                </div>
            </div>

            <PurchaseEntryForm
                products={productsResult.data || []}
                suppliers={suppliersResult.data || []}
            />
        </div>
    );
}
