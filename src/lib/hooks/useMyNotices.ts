"use client";

import { useEffect, useMemo, useState } from "react";
import { arrayUnion, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { noticesCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { useTenantLeases } from "@/lib/hooks/useTenantLeases";
import type { NoticeDoc } from "@/lib/types/models";

export interface TenantNotice extends NoticeDoc {
  unread: boolean;
}

export function useMyNotices() {
  const { user } = useAuth();
  const { activeLeases } = useTenantLeases(user?.uid);
  const [rawNotices, setRawNotices] = useState<NoticeDoc[]>([]);

  // A tenant may have active leases with more than one PM/property/unit —
  // aggregate across all of them instead of resolving down to a single one.
  const pmIds = useMemo(
    () => Array.from(new Set(activeLeases.map((l) => l.lease.pmId).filter(Boolean))),
    [activeLeases],
  );
  const propertyIds = useMemo(
    () => new Set(activeLeases.map((l) => l.lease.propertyId)),
    [activeLeases],
  );
  const unitIds = useMemo(
    () => new Set(activeLeases.map((l) => l.lease.unitId)),
    [activeLeases],
  );

  // Query notices from every PM the tenant has an active lease with.
  useEffect(() => {
    if (pmIds.length === 0) { setRawNotices([]); return; }
    const q = query(noticesCol(), where("pmId", "in", pmIds));
    return onSnapshot(q, (snap) => {
      setRawNotices(snap.docs.map((d) => ({ ...d.data(), id: d.id } as NoticeDoc)));
    });
  }, [pmIds]);

  const uid = user?.uid ?? null;

  const notices = useMemo<TenantNotice[]>(() => {
    if (!uid) return [];
    const filtered = rawNotices.filter((n) => {
      if (n.scope === "all") return true;
      if (n.scope === "property" && n.scopeId && propertyIds.has(n.scopeId)) return true;
      if (n.scope === "unit" && n.scopeId && unitIds.has(n.scopeId)) return true;
      return false;
    });
    return filtered
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((n) => ({ ...n, unread: !(n.readBy ?? []).includes(uid) }));
  }, [rawNotices, propertyIds, unitIds, uid]);

  const unreadCount = useMemo(() => notices.filter((n) => n.unread).length, [notices]);

  async function markRead(noticeId: string) {
    if (!user) return;
    await updateDoc(doc(db, "notices", noticeId), { readBy: arrayUnion(user.uid) });
  }

  async function markAllRead() {
    if (!user) return;
    await Promise.all(
      notices
        .filter((n) => n.unread)
        .map((n) => updateDoc(doc(db, "notices", n.id), { readBy: arrayUnion(user.uid) })),
    );
  }

  return { notices, unreadCount, markRead, markAllRead };
}
