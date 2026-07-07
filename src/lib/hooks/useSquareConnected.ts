"use client";

import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";

interface ConnectionStatus {
  connected: boolean;
  connectedAt?: number;
}

/** Whether the signed-in PM has a Square account connected for receiving
 * tenant rent payments. `connected` is null while loading. */
export function useSquareConnected(enabled: boolean) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [connectedAt, setConnectedAt] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      setConnected(null);
      return;
    }
    let cancelled = false;
    const call = httpsCallable<unknown, ConnectionStatus>(functions, "getSquareConnectionStatus");
    call({})
      .then((res) => {
        if (cancelled) return;
        setConnected(res.data.connected);
        setConnectedAt(res.data.connectedAt);
      })
      .catch(() => {
        if (!cancelled) setConnected(false);
      });
    return () => { cancelled = true; };
  }, [enabled]);

  return { connected, connectedAt };
}
