"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { UnitDoc } from "@/lib/types/models";

export function useUnit(unitId: string | undefined) {
  const [unit, setUnit] = useState<UnitDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!unitId) {
      setUnit(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(doc(db, "units", unitId), (snap) => {
      setUnit(snap.exists() ? (snap.data() as UnitDoc) : null);
      setLoading(false);
    });
    return unsub;
  }, [unitId]);

  return { unit, loading };
}
