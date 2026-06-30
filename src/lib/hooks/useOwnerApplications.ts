"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { applicationsCol, listingsCol } from "@/lib/firebase/firestore";
import type { ApplicationDoc } from "@/lib/types/models";

export function useOwnerApplications(ownerId: string | undefined) {
  const [applications, setApplications] = useState<ApplicationDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) {
      setApplications([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    let unsubApps: (() => void) | undefined;

    const listingsQ = query(listingsCol(), where("ownerId", "==", ownerId));
    const unsubListings = onSnapshot(listingsQ, (listingsSnap) => {
      unsubApps?.();
      const listingIds = listingsSnap.docs.map((d) => d.id).slice(0, 10);
      if (listingIds.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }
      const appsQ = query(
        applicationsCol(),
        where("listingId", "in", listingIds),
      );
      unsubApps = onSnapshot(
        appsQ,
        (snap) => {
          setApplications(snap.docs.map((d) => d.data()));
          setLoading(false);
        },
        () => setLoading(false),
      );
    });

    return () => {
      unsubListings();
      unsubApps?.();
    };
  }, [ownerId]);

  return { applications, loading };
}
