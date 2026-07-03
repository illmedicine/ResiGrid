"use client";

import { useEffect, useState } from "react";
import { onSnapshot, orderBy, query, where } from "firebase/firestore";
import { applicationsCol } from "@/lib/firebase/firestore";
import { useEffectivePMId } from "@/lib/hooks/useEffectivePMId";
import type { ApplicationDoc } from "@/lib/types/models";

export function useOwnerApplications(ownerId: string | undefined) {
  const { effectiveId } = useEffectivePMId();
  const [applications, setApplications] = useState<ApplicationDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const queryId = ownerId ? (effectiveId ?? ownerId) : undefined;

  useEffect(() => {
    if (!queryId) {
      setApplications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      applicationsCol(),
      where("pmId", "==", queryId),
      orderBy("submittedAt", "desc"),
    );
    return onSnapshot(
      q,
      (snap) => {
        setApplications(snap.docs.map((d) => d.data()));
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [queryId]);

  return { applications, loading };
}
