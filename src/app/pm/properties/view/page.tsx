"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PropertyDetail } from "@/components/pm/PropertyDetail";

function PropertyViewContent() {
  const params = useSearchParams();
  const id = params.get("id");
  if (!id) return <p className="text-sm text-neutral-600">No property specified.</p>;
  return <PropertyDetail propertyId={id} />;
}

export default function PmPropertyViewPage() {
  return (
    <Suspense>
      <PropertyViewContent />
    </Suspense>
  );
}
