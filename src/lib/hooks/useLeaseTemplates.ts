"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { leaseTemplatesCol } from "@/lib/firebase/firestore";
import { useEffectivePMId } from "@/lib/hooks/useEffectivePMId";
import type { LeaseTemplateDoc } from "@/lib/types/models";

export function useLeaseTemplates(pmId: string | undefined) {
  const { effectiveId } = useEffectivePMId();
  const queryId = pmId ? (effectiveId ?? pmId) : undefined;
  const [templates, setTemplates] = useState<LeaseTemplateDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!queryId) {
      setTemplates([]);
      setLoading(false);
      return;
    }
    const q = query(leaseTemplatesCol(), where("pmId", "==", queryId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTemplates(snap.docs.map((d) => d.data()));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [queryId]);

  return { templates, loading };
}
