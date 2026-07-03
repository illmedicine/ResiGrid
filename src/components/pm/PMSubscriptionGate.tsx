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

  // Access matrix:
  //  ✅ Paid (isActive)          → full access, no banner
  //  ✅ Within free trial        → full access + countdown banner
  //  ✅ Team member (teamAdminId)→ full access to assigned properties, no subscription needed
  //  🔒 Trial expired + unpaid  → redirect to checkout
  const isTeamMember = !!userDoc?.teamAdminId;
  const hasAccess = isActive || trial.inTrial || isTeamMember;

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
      {!isActive && !isTeamMember && trial.inTrial && <TrialBanner trial={trial} />}
      {children}
    </>
  );
}
