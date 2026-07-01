"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { unitsCol } from "@/lib/firebase/firestore";
import type { UnitDoc } from "@/lib/types/models";

export function useUnitsForProperty(propertyId: string | undefined) {
  const [units, setUnits] = useState<UnitDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) {
      setUnits([]);
      setLoading(false);
      return;
    }
    const q = query(unitsCol(), where("propertyId", "==", propertyId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setUnits(snap.docs.map((d) => ({ ...d.data(), id: d.id } as UnitDoc)));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [propertyId]);

  return { units, loading };
}
