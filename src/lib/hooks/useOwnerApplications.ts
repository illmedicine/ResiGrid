"use client";

import { useEffect, useState } from "react";
import { onSnapshot, orderBy, query, where } from "firebase/firestore";
import { applicationsCol } from "@/lib/firebase/firestore";
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
    const q = query(
      applicationsCol(),
      where("pmId", "==", ownerId),
      orderBy("submittedAt", "desc"),
    );
    return onSnapshot(
      q,
      (snap) => {
        setApplications(snap.docs.map((d) => d.data()));
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [ownerId]);

  return { applications, loading };
}
