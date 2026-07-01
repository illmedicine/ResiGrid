"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { PMSubscriptionDoc } from "@/lib/types/models";

export const TRIAL_DAYS = 3;
const TRIAL_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;

export interface TrialStatus {
  inTrial: boolean;
  trialExpired: boolean;
  msRemaining: number;
  hoursRemaining: number;
  daysRemaining: number;
}

export function calcTrialStatus(createdAt: number | undefined): TrialStatus {
  if (!createdAt) {
    return { inTrial: false, trialExpired: false, msRemaining: 0, hoursRemaining: 0, daysRemaining: 0 };
  }
  const expiresAt = createdAt + TRIAL_MS;
  const msRemaining = Math.max(0, expiresAt - Date.now());
  const hoursRemaining = Math.ceil(msRemaining / (1000 * 60 * 60));
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  return {
    inTrial: msRemaining > 0,
    trialExpired: msRemaining === 0,
    msRemaining,
    hoursRemaining,
    daysRemaining,
  };
}

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
