"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { propertiesCol } from "@/lib/firebase/firestore";
import { useEffectivePMId } from "@/lib/hooks/useEffectivePMId";
import type { PropertyDoc } from "@/lib/types/models";

export function useOwnerProperties(ownerId: string | undefined) {
  const { effectiveId, teamPropertyIds } = useEffectivePMId();
  const [properties, setProperties] = useState<PropertyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Use effectiveId when caller passes a uid (team members query admin's data).
  // Fall back to the passed ownerId if effectiveId isn't resolved yet.
  const queryId = ownerId ? (effectiveId ?? ownerId) : undefined;

  useEffect(() => {
    if (!queryId) {
      setProperties([]);
      setLoading(false);
      return;
    }
    const q = query(propertiesCol(), where("ownerId", "==", queryId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        let docs = snap.docs
          .map((d) => ({ ...d.data(), id: d.id }))
          .sort((a, b) => b.createdAt - a.createdAt);
        // Team members only see properties they've been granted access to.
        if (teamPropertyIds !== null) {
          docs = docs.filter((p) => teamPropertyIds.includes(p.id));
        }
        setProperties(docs);
        setQueryError(null);
        setLoading(false);
      },
      (err) => {
        console.error("useOwnerProperties error:", err.message);
        setQueryError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [queryId, teamPropertyIds]);

  return { properties, loading, queryError };
}
