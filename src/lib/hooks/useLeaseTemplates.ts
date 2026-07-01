"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { leaseTemplatesCol } from "@/lib/firebase/firestore";
import type { LeaseTemplateDoc } from "@/lib/types/models";

export function useLeaseTemplates(pmId: string | undefined) {
  const [templates, setTemplates] = useState<LeaseTemplateDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pmId) {
      setTemplates([]);
      setLoading(false);
      return;
    }
    const q = query(leaseTemplatesCol(), where("pmId", "==", pmId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTemplates(snap.docs.map((d) => d.data()));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [pmId]);

  return { templates, loading };
}
