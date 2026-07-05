"use client";

import { useMemo, useEffect, useState } from "react";
import { arrayUnion, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { leasesCol, leaseTermsCol, noticesCol, unitsCol } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import type { NoticeDoc } from "@/lib/types/models";

export interface TenantNotice extends NoticeDoc {
  unread: boolean;
}

export function useMyNotices() {
  const { user } = useAuth();
  const [pmId, setPmId] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [rawNotices, setRawNotices] = useState<NoticeDoc[]>([]);

  // Resolve pmId from leases
  useEffect(() => {
    if (!user) return;
    const q = query(leasesCol(), where("tenantId", "==", user.uid));
    return onSnapshot(q, (snap) => {
      const sorted = snap.docs
        .map((d) => d.data())
        .sort((a, b) => b.createdAt - a.createdAt);
      if (sorted[0]?.pmId) setPmId(sorted[0].pmId);
    });
  }, [user]);

  // Fallback: resolve pmId from leaseTerms
  useEffect(() => {
    if (!user) return;
    const q = query(leaseTermsCol(), where("tenantId", "==", user.uid));
    return onSnapshot(q, (snap) => {
      const sorted = snap.docs
        .map((d) => d.data())
        .sort((a, b) => b.createdAt - a.createdAt);
      if (sorted[0]?.pmId) setPmId((prev) => prev ?? sorted[0].pmId);
    });
  }, [user]);

  // Resolve propertyId and unitId from unit assignment
  useEffect(() => {
    if (!user) return;
    const q = query(unitsCol(), where("currentTenantId", "==", user.uid));
    return onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const unitSnap = snap.docs[0];
        setPropertyId(unitSnap.data().propertyId);
        setUnitId(unitSnap.id);
      }
    });
  }, [user]);

  // Query notices for this tenant's PM
  useEffect(() => {
    if (!pmId) { setRawNotices([]); return; }
    const q = query(noticesCol(), where("pmId", "==", pmId));
    return onSnapshot(q, (snap) => {
      setRawNotices(snap.docs.map((d) => ({ ...d.data(), id: d.id } as NoticeDoc)));
    });
  }, [pmId]);

  const uid = user?.uid ?? null;

  const notices = useMemo<TenantNotice[]>(() => {
    if (!uid) return [];
    const filtered = rawNotices.filter((n) => {
      if (n.scope === "all") return true;
      if (n.scope === "property" && propertyId && n.scopeId === propertyId) return true;
      if (n.scope === "unit" && unitId && n.scopeId === unitId) return true;
      return false;
    });
    return filtered
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((n) => ({ ...n, unread: !(n.readBy ?? []).includes(uid) }));
  }, [rawNotices, propertyId, unitId, uid]);

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
