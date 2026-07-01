"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PublishListingForm } from "@/components/pm/PublishListingForm";

function NewListingContent() {
  const params = useSearchParams();
  const unitId = params.get("unitId") ?? "";
  const propertyId = params.get("propertyId") ?? "";

  if (!unitId || !propertyId) {
    return (
      <p className="text-sm text-neutral-600">
        Invalid link — navigate here from your property&apos;s unit page.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Publish a Listing</h1>
        <p className="text-sm text-neutral-600">
          Add photos and details to attract quality tenants. Your listing will appear publicly in the ResiGrid search.
        </p>
      </div>
      <PublishListingForm unitId={unitId} propertyId={propertyId} />
    </div>
  );
}

export default function NewListingPage() {
  return (
    <Suspense>
      <NewListingContent />
    </Suspense>
  );
}
