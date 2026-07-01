"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { UserDoc } from "@/lib/types/models";

export function useTenantSearch(searchTerm: string) {
  const [results, setResults] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    // Fetch all tenants and filter client-side (Firestore lacks native full-text search).
    const q = query(collection(db, "users"), where("role", "==", "tenant"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const all = snap.docs.map((d) => d.data() as UserDoc);
        const filtered = all.filter(
          (u) =>
            u.displayName?.toLowerCase().includes(term) ||
            u.email?.toLowerCase().includes(term),
        );
        setResults(filtered.slice(0, 10));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [searchTerm]);

  return { results, loading };
}
