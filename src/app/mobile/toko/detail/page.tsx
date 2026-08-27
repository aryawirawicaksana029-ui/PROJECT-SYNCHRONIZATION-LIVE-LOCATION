"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DetailTokoClient from "../[id]/DetailTokoClient";

function DetailTokoContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("id") || "1";

  return <DetailTokoClient storeId={storeId} />;
}

export default function DetailTokoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 w-full flex-col items-center justify-center p-8 text-center text-navy-400">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-600 border-t-transparent mb-3" />
          <p className="text-xs font-semibold">Memuat Detail Toko...</p>
        </div>
      }
    >
      <DetailTokoContent />
    </Suspense>
  );
}
