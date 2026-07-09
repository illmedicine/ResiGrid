"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  applicationsCol,
  maintenanceRequestsCol,
  paymentsCol,
  sharedDocumentsCol,
} from "@/lib/firebase/firestore";
import type { BadgeDoc, MaintenanceRequestDoc, PaymentDoc, ReputationScoreDoc, UserDoc } from "@/lib/types/models";

export interface TenantRowStats {
  loading: boolean;
  totalPaid: number;
  /** Shared file uploads + applications on file — NOT counting the lease itself. */
  docsSubmitted: number;
  score: number | null;
  badges: BadgeDoc[];
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
  badges: [],
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
      // Plain getDocs() multi-equality queries (no orderBy, no aggregation)
      // for everything — counts/sums are derived client-side below. Using
      // Promise.allSettled means one query failing (e.g. a permission or
      // index hiccup) can't blank out every other stat on the row, and each
      // rejection is logged instead of silently swallowed.
      const [sharedDocsResult, appsResult, completedPaymentsResult, maintenanceResult, scoreResult, userResult] =
        await Promise.allSettled([
          getDocs(
            query(sharedDocumentsCol(), where("tenantId", "==", tenantId), where("pmId", "==", pmId)),
          ),
          getDocs(
            query(applicationsCol(), where("tenantId", "==", tenantId), where("pmId", "==", pmId)),
          ),
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

      for (const [label, result] of [
        ["sharedDocuments", sharedDocsResult],
        ["applications", appsResult],
        ["payments", completedPaymentsResult],
        ["maintenanceRequests", maintenanceResult],
        ["reputationScores", scoreResult],
        ["users", userResult],
      ] as const) {
        if (result.status === "rejected") {
          console.error(`useTenantRowStats: ${label} query failed`, result.reason);
        }
      }

      const sharedDocsCount = sharedDocsResult.status === "fulfilled" ? sharedDocsResult.value.size : 0;
      const appsCount = appsResult.status === "fulfilled" ? appsResult.value.size : 0;

      const paidDocs = completedPaymentsResult.status === "fulfilled" ? completedPaymentsResult.value.docs : [];
      const totalPaid = paidDocs.reduce((sum, d) => sum + ((d.data() as PaymentDoc).amount ?? 0), 0);
      const paidDates = paidDocs
        .map((d) => (d.data() as PaymentDoc).paidDate)
        .filter((d): d is number => d != null);

      const hasUrgentOpenMaintenance =
        maintenanceResult.status === "fulfilled" &&
        maintenanceResult.value.docs.some((d) => {
          const req = d.data() as MaintenanceRequestDoc;
          return OPEN_STATUSES.has(req.status) && URGENT_PRIORITIES.has(req.priority);
        });

      const scoreSnap = scoreResult.status === "fulfilled" ? scoreResult.value : null;
      const userSnap = userResult.status === "fulfilled" ? userResult.value : null;

      const scoreData = scoreSnap?.exists() ? (scoreSnap.data() as ReputationScoreDoc) : null;

      setStats({
        loading: false,
        totalPaid,
        docsSubmitted: sharedDocsCount + appsCount,
        score: scoreData?.score ?? null,
        badges: scoreData?.badges ?? [],
        tenantCreatedAt: userSnap?.exists() ? (userSnap.data() as UserDoc).createdAt ?? null : null,
        lastCompletedPaymentAt: paidDates.length > 0 ? Math.max(...paidDates) : null,
        hasUrgentOpenMaintenance,
      });
    }

    load().catch((err) => {
      console.error("useTenantRowStats: load() failed", err);
      if (!cancelled) setStats((s) => ({ ...s, loading: false }));
    });

    return () => {
      cancelled = true;
    };
  }, [tenantId, pmId]);

  return stats;
}
