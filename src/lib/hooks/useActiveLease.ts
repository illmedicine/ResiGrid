"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { leasesCol } from "@/lib/firebase/firestore";
import type { LeaseDoc } from "@/lib/types/models";

export function useActiveLease(tenantId: string | undefined) {
  const [lease, setLease] = useState<LeaseDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) {
      setLease(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(leasesCol(), where("tenantId", "==", tenantId));
    const unsub = onSnapshot(q, (snap) => {
      const now = Date.now();
      const leases = snap.docs.map((d) => d.data());
      const active =
        leases.find((l) => l.endDate >= now) ?? leases[0] ?? null;
      setLease(active);
      setLoading(false);
    });
    return unsub;
  }, [tenantId]);

  return { lease, loading };
}
