import DetailTokoClient from "./DetailTokoClient";

// Export static params for Next.js static export mode
export function generateStaticParams() {
  return [
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "4" },
    { id: "5" },
  ];
}

export default async function DetailTokoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <DetailTokoClient storeId={resolvedParams.id} />;
}
