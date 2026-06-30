"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PublicNavBar } from "@/components/layout/PublicNavBar";
import { ClaimContent } from "@/components/claim/ClaimContent";

function ClaimPageContent() {
  const params = useSearchParams();
  const token = params.get("token");

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
      {token ? (
        <ClaimContent token={token} />
      ) : (
        <p className="text-sm text-neutral-600">No claim token provided.</p>
      )}
    </main>
  );
}

export default function ClaimPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicNavBar />
      <Suspense>
        <ClaimPageContent />
      </Suspense>
    </div>
  );
}
