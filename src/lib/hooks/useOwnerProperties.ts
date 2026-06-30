"use client";

import { useEffect, useState } from "react";
import { onSnapshot, orderBy, query, where } from "firebase/firestore";
import { propertiesCol } from "@/lib/firebase/firestore";
import type { PropertyDoc } from "@/lib/types/models";

export function useOwnerProperties(ownerId: string | undefined) {
  const [properties, setProperties] = useState<PropertyDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) {
      setProperties([]);
      setLoading(false);
      return;
    }
    const q = query(
      propertiesCol(),
      where("ownerId", "==", ownerId),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setProperties(snap.docs.map((d) => d.data()));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [ownerId]);

  return { properties, loading };
}
