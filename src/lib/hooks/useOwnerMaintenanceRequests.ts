"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { maintenanceRequestsCol, propertiesCol } from "@/lib/firebase/firestore";
import { useEffectivePMId } from "@/lib/hooks/useEffectivePMId";
import type { MaintenanceRequestDoc } from "@/lib/types/models";

export function useOwnerMaintenanceRequests(ownerId: string | undefined) {
  const { effectiveId, teamPropertyIds } = useEffectivePMId();
  const [requests, setRequests] = useState<MaintenanceRequestDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const queryId = ownerId ? (effectiveId ?? ownerId) : undefined;

  useEffect(() => {
    if (!queryId) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let unsubRequests: (() => void) | undefined;

    // Team members: skip the properties lookup, use teamPropertyIds directly.
    if (teamPropertyIds !== null) {
      const allowed = teamPropertyIds.slice(0, 10);
      if (allowed.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }
      const reqQ = query(maintenanceRequestsCol(), where("propertyId", "in", allowed));
      const unsub = onSnapshot(
        reqQ,
        (snap) => {
          setRequests(
            snap.docs
              .map((d) => ({ ...d.data(), id: d.id } as MaintenanceRequestDoc))
              .sort((a, b) => b.createdAt - a.createdAt),
          );
          setLoading(false);
        },
        () => setLoading(false),
      );
      return unsub;
    }

    // Admin: discover property IDs first, then query maintenance requests.
    const propertiesQ = query(propertiesCol(), where("ownerId", "==", queryId));
    const unsubProperties = onSnapshot(propertiesQ, (propSnap) => {
      unsubRequests?.();
      const propertyIds = propSnap.docs.map((d) => d.id).slice(0, 10);
      if (propertyIds.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }
      const reqQ = query(maintenanceRequestsCol(), where("propertyId", "in", propertyIds));
      unsubRequests = onSnapshot(
        reqQ,
        (snap) => {
          setRequests(
            snap.docs
              .map((d) => ({ ...d.data(), id: d.id } as MaintenanceRequestDoc))
              .sort((a, b) => b.createdAt - a.createdAt),
          );
          setLoading(false);
        },
        () => setLoading(false),
      );
    });

    return () => {
      unsubProperties();
      unsubRequests?.();
    };
  }, [queryId, teamPropertyIds]);

  return { requests, loading };
}
