"use client";

import { type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/firebase/hooks";
import { usePMSubscription, calcTrialStatus } from "@/lib/hooks/usePMSubscription";
import { TrialBanner } from "@/components/pm/TrialBanner";

// Portal access pausing (trial-expired redirect to checkout) is disabled —
// PMs always get full access. The trial banner still shows as a nudge, but
// nothing blocks entry.
export function PMSubscriptionGate({ children }: { children: ReactNode }) {
  const { user, userDoc, loading: authLoading } = useAuth();
  const { isActive, loading: subLoading } = usePMSubscription(user?.uid);

  const loading = authLoading || subLoading;
  const trial = calcTrialStatus(userDoc?.createdAt);
  const isTeamMember = !!userDoc?.teamAdminId;

  if (loading) {
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
