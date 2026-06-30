"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { PMSubscriptionDoc } from "@/lib/types/models";

export function usePMSubscription(uid: string | undefined) {
  const [sub, setSub] = useState<PMSubscriptionDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setSub(null);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      doc(db, "pmSubscriptions", uid),
      (snap) => {
        setSub(snap.exists() ? (snap.data() as PMSubscriptionDoc) : null);
        setLoading(false);
      },
      () => {
        setSub(null);
        setLoading(false);
      },
    );
    return unsub;
  }, [uid]);

  return { sub, loading, isActive: sub?.active === true };
}
