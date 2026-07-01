"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { leasesCol } from "@/lib/firebase/firestore";
import type { LeaseDoc } from "@/lib/types/models";

export function useOwnerLeases(pmId: string | undefined) {
  const [leases, setLeases] = useState<LeaseDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pmId) {
      setLeases([]);
      setLoading(false);
      return;
    }
    const q = query(leasesCol(), where("pmId", "==", pmId));
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
  }, [pmId]);

  return { leases, loading };
}
