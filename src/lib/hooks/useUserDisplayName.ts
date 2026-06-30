"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export function useUserDisplayName(uid: string | undefined) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setName(null);
      return;
    }
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      setName(snap.exists() ? (snap.data().displayName as string) : uid);
    });
    return unsub;
  }, [uid]);

  return name;
}
