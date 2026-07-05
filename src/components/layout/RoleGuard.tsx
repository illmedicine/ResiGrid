"use client";

import { type ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/hooks";
import type { UserRole } from "@/lib/types/models";

interface RoleGuardProps {
  role: UserRole;
  children: ReactNode;
}

export function RoleGuard({ role, children }: RoleGuardProps) {
  const { user, userDoc, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(role === "property_manager" ? "/login?role=property_manager" : "/login?role=tenant");
      return;
    }
    if (userDoc && userDoc.role !== role) {
      router.replace(userDoc.role === "tenant" ? "/tenant/dashboard" : "/pm/dashboard");
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
