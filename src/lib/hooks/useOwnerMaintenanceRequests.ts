"use client";

import { useEffect, useState } from "react";
import { onSnapshot, orderBy, query, where } from "firebase/firestore";
import { maintenanceRequestsCol, propertiesCol } from "@/lib/firebase/firestore";
import type { MaintenanceRequestDoc } from "@/lib/types/models";

export function useOwnerMaintenanceRequests(ownerId: string | undefined) {
  const [requests, setRequests] = useState<MaintenanceRequestDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let unsubRequests: (() => void) | undefined;

    const propertiesQ = query(propertiesCol(), where("ownerId", "==", ownerId));
    const unsubProperties = onSnapshot(propertiesQ, (propSnap) => {
      unsubRequests?.();
      const propertyIds = propSnap.docs.map((d) => d.id).slice(0, 10);
      if (propertyIds.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }
      const reqQ = query(
        maintenanceRequestsCol(),
        where("propertyId", "in", propertyIds),
        orderBy("createdAt", "desc"),
      );
      unsubRequests = onSnapshot(
        reqQ,
        (snap) => {
          setRequests(snap.docs.map((d) => d.data()));
          setLoading(false);
        },
        () => setLoading(false),
      );
    });

    return () => {
      unsubProperties();
      unsubRequests?.();
    };
  }, [ownerId]);

  return { requests, loading };
}
