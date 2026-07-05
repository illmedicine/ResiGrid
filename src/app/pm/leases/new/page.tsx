"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LeaseBuilderForm } from "@/components/pm/lease/LeaseBuilderForm";

function NewLeaseContent() {
  const params = useSearchParams();
  const applicationId = params.get("applicationId") ?? undefined;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Create Lease Agreement</h1>
        <p className="text-sm text-neutral-600">
          Fill in the details below, pick a template to auto-populate common terms,
          then send directly to your tenant.
        </p>
      </div>
      <LeaseBuilderForm initialApplicationId={applicationId} />
    </div>
  );
}

export default function NewLeasePage() {
  return (
    <Suspense>
      <NewLeaseContent />
    </Suspense>
  );
}
