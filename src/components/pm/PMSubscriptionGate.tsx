"use client";

import { type ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/firebase/hooks";
import { usePMSubscription } from "@/lib/hooks/usePMSubscription";

export function PMSubscriptionGate({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isActive, loading: subLoading } = usePMSubscription(user?.uid);
  const router = useRouter();

  const loading = authLoading || subLoading;

  useEffect(() => {
    if (loading) return;
    if (!isActive) {
      router.replace("/pm/checkout");
    }
  }, [loading, isActive, router]);

  if (loading || !isActive) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
      </div>
    );
  }

  return <>{children}</>;
}
