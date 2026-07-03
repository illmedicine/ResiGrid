"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { leasesCol } from "@/lib/firebase/firestore";
import { useEffectivePMId } from "@/lib/hooks/useEffectivePMId";
import type { LeaseDoc } from "@/lib/types/models";

export function useOwnerLeases(pmId: string | undefined) {
  const { effectiveId } = useEffectivePMId();
  const [leases, setLeases] = useState<LeaseDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const queryId = pmId ? (effectiveId ?? pmId) : undefined;

  useEffect(() => {
    if (!queryId) {
      setLeases([]);
      setLoading(false);
      return;
    }
    const q = query(leasesCol(), where("pmId", "==", queryId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs
          .map((d) => ({ ...d.data(), id: d.id } as LeaseDoc))
          .sort((a, b) => b.createdAt - a.createdAt);
        setLeases(docs);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [queryId]);

  return { leases, loading };
}
