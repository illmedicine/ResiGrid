import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { db } from "../lib/firebaseAdmin";
import type { PaymentDoc, ReputationScoreDoc } from "../types";

interface BadgeDefinition {
  id: string;
  label: string;
  description: string;
  streakThreshold?: number;
  onTimeCountThreshold?: number;
}

// Mirrors src/lib/reputation/badges.ts in the Next.js app.
const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: "first_payment", label: "First Payment", description: "Made your first on-time rent payment on ResiGrid.", onTimeCountThreshold: 1 },
  { id: "six_month_streak", label: "6-Month Streak", description: "6 consecutive on-time rent payments.", streakThreshold: 6 },
  { id: "twelve_month_streak", label: "12-Month Streak", description: "12 consecutive on-time rent payments.", streakThreshold: 12 },
  { id: "twenty_four_month_streak", label: "2-Year Streak", description: "24 consecutive on-time rent payments.", streakThreshold: 24 },
  { id: "always_on_time_25", label: "Always On Time", description: "25 total on-time payments with no late payments.", onTimeCountThreshold: 25 },
];

function computeScore(onTimeCount: number, lateCount: number): number {
  const total = onTimeCount + lateCount;
  if (total === 0) return 0;
  return Math.round((onTimeCount / total) * 100);
}

export const recalcReputationOnPayment = onDocumentCreated(
  "payments/{paymentId}",
  async (event) => {
    const payment = event.data?.data() as PaymentDoc | undefined;
    if (!payment || payment.status !== "completed" || payment.onTime === undefined) return;

    const ref = db.collection("reputationScores").doc(payment.tenantId);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const existing = snap.exists ? (snap.data() as ReputationScoreDoc) : undefined;

      const onTimeCount = (existing?.onTimeCount ?? 0) + (payment.onTime ? 1 : 0);
      const lateCount = (existing?.lateCount ?? 0) + (payment.onTime ? 0 : 1);
      const currentStreak = payment.onTime ? (existing?.currentStreak ?? 0) + 1 : 0;
      const totalCount = onTimeCount + lateCount;

      const existingBadgeIds = new Set((existing?.badges ?? []).map((b) => b.id));
      const newlyEarned = BADGE_DEFINITIONS.filter((badge) => {
        if (existingBadgeIds.has(badge.id)) return false;
        if (badge.streakThreshold && currentStreak >= badge.streakThreshold) return true;
        if (badge.onTimeCountThreshold && onTimeCount >= badge.onTimeCountThreshold) return true;
        return false;
      });

      const badges = [
        ...(existing?.badges ?? []),
        ...newlyEarned.map((b) => ({
          id: b.id,
          label: b.label,
          description: b.description,
          earnedAt: Date.now(),
        })),
      ];

      const updated: ReputationScoreDoc = {
        tenantId: payment.tenantId,
        onTimeCount,
        lateCount,
        totalCount,
        currentStreak,
        badges,
        score: computeScore(onTimeCount, lateCount),
      };
      tx.set(ref, updated);
    });
  },
);
