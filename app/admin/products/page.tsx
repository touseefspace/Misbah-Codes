import { getProductsAction } from "@/app/actions";
import ProductsTable from "./ProductsTable";

export default async function ProductsPage() {
    const { data: products, error } = await getProductsAction();

    if (error) {
        return <div className="p-8 text-red-500">Error loading products: {error}</div>;
    }

    return (
        <ProductsTable initialProducts={products || []} />
    );
}
