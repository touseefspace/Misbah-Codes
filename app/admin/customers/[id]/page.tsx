import EntityLedger from "@/components/entities/EntityLedger";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CustomerLedgerPage({ params }: PageProps) {
    const { id } = await params;
    return <EntityLedger entityId={id} />;
}
