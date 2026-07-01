"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { propertiesCol } from "@/lib/firebase/firestore";
import type { PropertyDoc } from "@/lib/types/models";

export function useOwnerProperties(ownerId: string | undefined) {
  const [properties, setProperties] = useState<PropertyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryError, setQueryError] = useState<string | null>(null);

  useEffect(() => {
    if (!ownerId) {
      setProperties([]);
      setLoading(false);
      return;
    }
    // Single-field where clause — no composite index required.
    // Sorted client-side so this works before indexes are deployed.
    const q = query(propertiesCol(), where("ownerId", "==", ownerId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs
          .map((d) => ({ ...d.data(), id: d.id }))   // always use real doc ID
          .sort((a, b) => b.createdAt - a.createdAt);
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
  }, [ownerId]);

  return { properties, loading, queryError };
}
