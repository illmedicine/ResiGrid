"use client";

import { useEffect, useState } from "react";
import { onSnapshot, orderBy, query, where } from "firebase/firestore";
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
    const q = query(
      leasesCol(),
      where("pmId", "==", pmId),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setLeases(snap.docs.map((d) => d.data()));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [pmId]);

  return { leases, loading };
}
