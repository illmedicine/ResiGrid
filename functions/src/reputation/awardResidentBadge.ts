import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { db } from "../lib/firebaseAdmin";
import type { ReputationScoreDoc } from "../types";

const RESIDENT_BADGE = {
  id: "resident",
  label: "🏠 Resident",
  description: "Signed a lease and joined the Residential Grid Economy.",
};

interface LeaseTermsSnap {
  tenantId?: string;
  status?: string;
}

export const awardResidentBadge = onDocumentWritten(
  "leaseTerms/{leaseId}",
  async (event) => {
    const after = event.data?.after?.data() as LeaseTermsSnap | undefined;
    const before = event.data?.before?.data() as LeaseTermsSnap | undefined;

    // Only act when status transitions to fully_signed
    if (after?.status !== "fully_signed") return;
    if (before?.status === "fully_signed") return; // already processed
    const tenantId = after.tenantId;
    if (!tenantId) return;

    const ref = db.collection("reputationScores").doc(tenantId);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const existing = snap.exists ? (snap.data() as ReputationScoreDoc) : null;

      // Skip if badge already awarded
      if (existing?.badges?.some((b) => b.id === RESIDENT_BADGE.id)) return;

      const badges = [
        ...(existing?.badges ?? []),
        { ...RESIDENT_BADGE, earnedAt: Date.now() },
      ];

      if (existing) {
        tx.update(ref, { badges });
      } else {
        // Create a baseline reputation doc if none exists yet
        const baseline: ReputationScoreDoc = {
          tenantId,
          onTimeCount: 0,
          lateCount: 0,
          totalCount: 0,
          currentStreak: 0,
          badges,
          score: 0,
        };
        tx.set(ref, baseline);
      }
    });
  },
);
