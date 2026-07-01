"use client";

import { type ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/firebase/hooks";
import { usePMSubscription, calcTrialStatus } from "@/lib/hooks/usePMSubscription";
import { TrialBanner } from "@/components/pm/TrialBanner";

export function PMSubscriptionGate({ children }: { children: ReactNode }) {
  const { user, userDoc, loading: authLoading } = useAuth();
  const { isActive, loading: subLoading } = usePMSubscription(user?.uid);
  const router = useRouter();

  const loading = authLoading || subLoading;
  const trial = calcTrialStatus(userDoc?.createdAt);

  // Access rules:
  //  1. Paid (isActive)  → always allowed
  //  2. In free trial    → allowed + banner shown
  //  3. Trial expired + not paid → redirect to checkout
  const hasAccess = isActive || trial.inTrial;

  useEffect(() => {
    if (loading) return;
    if (!hasAccess) {
      router.replace("/pm/checkout?reason=trial_expired");
    }
  }, [loading, hasAccess, router]);

  if (loading || !hasAccess) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <>
      {/* Show trial banner only while in trial (not yet paid) */}
      {!isActive && trial.inTrial && <TrialBanner trial={trial} />}
      {children}
    </>
  );
}
