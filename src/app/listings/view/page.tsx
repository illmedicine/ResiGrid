"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PublicNavBar } from "@/components/layout/PublicNavBar";
import { ListingDetail } from "@/components/shared/ListingDetail";

function ListingViewContent() {
  const params = useSearchParams();
  const id = params.get("id");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 md:px-8">
      {id ? (
        <ListingDetail listingId={id} />
      ) : (
        <p className="text-sm text-neutral-600">No listing specified.</p>
      )}
    </main>
  );
}

export default function ListingViewPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicNavBar />
      <Suspense>
        <ListingViewContent />
      </Suspense>
    </div>
  );
}
