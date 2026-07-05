"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getAggregateFromServer,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  sum,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  applicationsCol,
  maintenanceRequestsCol,
  paymentsCol,
  sharedDocumentsCol,
} from "@/lib/firebase/firestore";
import type { MaintenanceRequestDoc, PaymentDoc, ReputationScoreDoc, UserDoc } from "@/lib/types/models";

export interface TenantRowStats {
  loading: boolean;
  totalPaid: number;
  /** Shared file uploads + applications on file — NOT counting the lease itself. */
  docsSubmitted: number;
  score: number | null;
  tenantCreatedAt: number | null;
  lastCompletedPaymentAt: number | null;
  hasUrgentOpenMaintenance: boolean;
}

const OPEN_STATUSES = new Set(["submitted", "acknowledged", "in_progress"]);
const URGENT_PRIORITIES = new Set(["high", "urgent"]);

const EMPTY: TenantRowStats = {
  loading: true,
  totalPaid: 0,
  docsSubmitted: 0,
  score: null,
  tenantCreatedAt: null,
  lastCompletedPaymentAt: null,
  hasUrgentOpenMaintenance: false,
};

/**
 * One-shot (not realtime) per-tenant stats fetch — meant to run once per
 * visible row, so cost is bounded by how many rows are on screen/loaded, not
 * by a PM's total tenant count.
 */
export function useTenantRowStats(tenantId: string, pmId: string | undefined): TenantRowStats {
  const [stats, setStats] = useState<TenantRowStats>(EMPTY);

  useEffect(() => {
    if (!pmId || !tenantId) {
      setStats({ ...EMPTY, loading: false });
      return;
    }
    let cancelled = false;
    setStats(EMPTY);

    async function load() {
      const [paidAgg, docsCount, appsCount, completedPayments, maintenanceSnap, scoreSnap, userSnap] =
        await Promise.all([
          getAggregateFromServer(
            query(
              paymentsCol(),
              where("tenantId", "==", tenantId),
              where("pmId", "==", pmId),
              where("status", "==", "completed"),
            ),
            { total: sum("amount") },
          ),
          getCountFromServer(
            query(sharedDocumentsCol(), where("tenantId", "==", tenantId), where("pmId", "==", pmId)),
          ),
          getCountFromServer(
            query(applicationsCol(), where("tenantId", "==", tenantId), where("pmId", "==", pmId)),
          ),
          // Plain multi-equality query (no orderBy) so this doesn't need a
          // composite index — "most recent" is computed client-side below.
          getDocs(
            query(
              paymentsCol(),
              where("tenantId", "==", tenantId),
              where("pmId", "==", pmId),
              where("status", "==", "completed"),
            ),
          ),
          getDocs(
            query(maintenanceRequestsCol(), where("tenantId", "==", tenantId), where("pmId", "==", pmId)),
          ),
          getDoc(doc(db, "reputationScores", tenantId)),
          getDoc(doc(db, "users", tenantId)),
        ]);

      if (cancelled) return;

      const hasUrgentOpenMaintenance = maintenanceSnap.docs.some((d) => {
        const req = d.data() as MaintenanceRequestDoc;
        return OPEN_STATUSES.has(req.status) && URGENT_PRIORITIES.has(req.priority);
      });

      const paidDates = completedPayments.docs
        .map((d) => (d.data() as PaymentDoc).paidDate)
        .filter((d): d is number => d != null);

      setStats({
        loading: false,
        totalPaid: paidAgg.data().total ?? 0,
        docsSubmitted: (docsCount.data().count ?? 0) + (appsCount.data().count ?? 0),
        score: scoreSnap.exists() ? (scoreSnap.data() as ReputationScoreDoc).score : null,
        tenantCreatedAt: userSnap.exists() ? (userSnap.data() as UserDoc).createdAt ?? null : null,
        lastCompletedPaymentAt: paidDates.length > 0 ? Math.max(...paidDates) : null,
        hasUrgentOpenMaintenance,
      });
    }

    load().catch(() => {
      if (!cancelled) setStats((s) => ({ ...s, loading: false }));
    });

    return () => {
      cancelled = true;
    };
  }, [tenantId, pmId]);

  return stats;
}
