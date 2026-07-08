"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { EXTERNAL_METHOD_KEYS } from "@/lib/payments/externalMethods";
import { useSquareConnected } from "./useSquareConnected";
import type { PaymentMethodsConfig, PropertyManagerDoc } from "@/lib/types/models";

/** A PM's ways to receive money: Square (in-app card) and/or the direct-pay
 * apps they've configured (PayPal, Cash App, Venmo, Chime, Zelle). Used to gate
 * features that require the PM to have *some* payout method. Square status is
 * derived from the caller's own auth, so this only reflects the signed-in PM. */
export function usePayoutStatus(uid: string | undefined) {
  const { connected: squareConnected } = useSquareConnected(Boolean(uid));
  const [externalMethods, setExternalMethods] = useState<PaymentMethodsConfig | null>(null);

  useEffect(() => {
    if (!uid) {
      setExternalMethods(null);
      return;
    }
    return onSnapshot(
      doc(db, "propertyManagers", uid),
      (snap) =>
        setExternalMethods((snap.data() as PropertyManagerDoc | undefined)?.paymentMethods ?? {}),
      () => setExternalMethods({}),
    );
  }, [uid]);

  const hasExternal = externalMethods
    ? EXTERNAL_METHOD_KEYS.some((key) => Boolean(externalMethods[key]))
    : false;
  const loading = squareConnected === null || externalMethods === null;
  const hasAnyPayout = squareConnected === true || hasExternal;

  return { squareConnected, externalMethods, hasExternal, hasAnyPayout, loading };
}
