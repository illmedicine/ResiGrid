"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/firebase/hooks";
import { useTenantLeases, type TenantLease } from "@/lib/hooks/useTenantLeases";

interface TenantLeaseContextValue {
  leases: TenantLease[];
  activeLeases: TenantLease[];
  pendingLeases: TenantLease[];
  loading: boolean;
  selectedLeaseId: string | null;
  setSelectedLeaseId: (id: string) => void;
  selectedLease: TenantLease | null;
}

const TenantLeaseContext = createContext<TenantLeaseContextValue>({
  leases: [],
  activeLeases: [],
  pendingLeases: [],
  loading: true,
  selectedLeaseId: null,
  setSelectedLeaseId: () => {},
  selectedLease: null,
});

/**
 * A tenant may have more than one active signed lease at once. This provider
 * is the single source of truth for "which property is the tenant currently
 * viewing" — every tenant page should read `selectedLease` from here instead
 * of independently resolving "the" lease/unit/property itself.
 */
export function TenantLeaseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { leases, activeLeases, pendingLeases, loading } = useTenantLeases(user?.uid);
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);

  // Default to the most-recently-signed active lease; keep the current
  // selection if it's still among the active leases.
  useEffect(() => {
    if (loading) return;
    if (selectedLeaseId && activeLeases.some((l) => l.lease.id === selectedLeaseId)) return;
    setSelectedLeaseId(activeLeases[0]?.lease.id ?? null);
  }, [loading, activeLeases, selectedLeaseId]);

  const selectedLease = activeLeases.find((l) => l.lease.id === selectedLeaseId) ?? null;

  return (
    <TenantLeaseContext.Provider
      value={{
        leases,
        activeLeases,
        pendingLeases,
        loading,
        selectedLeaseId,
        setSelectedLeaseId,
        selectedLease,
      }}
    >
      {children}
    </TenantLeaseContext.Provider>
  );
}

export function useTenantLeaseContext() {
  return useContext(TenantLeaseContext);
}
