"use client";

import { type ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/hooks";
import type { UserRole } from "@/lib/types/models";

interface RoleGuardProps {
  role: UserRole;
  children: ReactNode;
}

// Firebase Auth's persistence fallback chain (see config.ts) can briefly
// re-fire onAuthStateChanged with a transient null/mismatched state under
// Incognito's stricter storage partitioning before settling back to the
// real signed-in state. Redirecting immediately on that blip can race with
// (and silently cancel) an in-flight client-side navigation the user just
// triggered. Waiting a beat confirms the bad state is real before acting.
const REDIRECT_GRACE_MS = 600;

export function RoleGuard({ role, children }: RoleGuardProps) {
  const { user, userDoc, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const timer = setTimeout(() => {
        router.replace(role === "property_manager" ? "/login?role=property_manager" : "/login?role=tenant");
      }, REDIRECT_GRACE_MS);
      return () => clearTimeout(timer);
    }
    if (userDoc && userDoc.role !== role) {
      const timer = setTimeout(() => {
        router.replace(userDoc.role === "tenant" ? "/tenant/dashboard" : "/pm/dashboard");
      }, REDIRECT_GRACE_MS);
      return () => clearTimeout(timer);
    }
  }, [loading, user, userDoc, role, router]);

  if (loading || !user || (userDoc && userDoc.role !== role)) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <p className="text-sm text-neutral-600">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
