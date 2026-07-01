"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Gift } from "lucide-react";
import { WatermarkLogo } from "@/components/ui/WatermarkLogo";
import { OnboardingWizard } from "@/components/pm/OnboardingWizard";

function OnboardingContent() {
  const params = useSearchParams();
  const fromClaim = params.get("from") === "claim";

  return (
    <div className="relative flex flex-col gap-5">
      <WatermarkLogo size={500} opacity={0.04} />

      <div>
        {fromClaim ? (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <Gift className="h-4 w-4 shrink-0 text-green-600" />
            <p className="text-sm text-green-800">
              <strong>Payment claimed!</strong> Your funds are on the way to your bank.
              Let&apos;s set up your property portal — it&apos;s completely free.
            </p>
          </div>
        ) : null}
        <h1 className="text-xl font-bold text-navy-900">Set up your property</h1>
        <p className="text-sm text-neutral-600">
          Complete these steps to get the most out of ResiGrid.
        </p>
      </div>

      <OnboardingWizard />
    </div>
  );
}

export default function PmOnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}
