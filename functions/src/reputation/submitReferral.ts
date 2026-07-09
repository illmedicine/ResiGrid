import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "../lib/firebaseAdmin";
import {
  computeScore,
  countActiveLeases,
  countDocsSubmitted,
  hasResidentBadge,
  residentFloor,
} from "./recalc";
import type { ReputationScoreDoc, UserDoc } from "../types";

const REFERRAL_CREDIT_POINTS = 20;
const REFERRAL_QUARTERLY_CAP = 5;

function currentQuarterKey(): string {
  const now = new Date();
  const quarter = Math.floor(now.getUTCMonth() / 3) + 1;
  return `${now.getUTCFullYear()}-Q${quarter}`;
}

interface SubmitReferralRequest {
  referredTenantId: string;
}

interface SubmitReferralResponse {
  referredDisplayName: string;
}

/** A tenant vouches for another platform tenant by pasting their raw tenant
 * ID — no name lookup/autocomplete, per spec, so this can't be used to probe
 * for other users' identities. Verifies the ID belongs to an existing tenant
 * account, then credits RGE (capped at 5/quarter, no repeat credits). */
export const submitReferral = onCall<SubmitReferralRequest, Promise<SubmitReferralResponse>>(
  { region: "us-central1", cors: true },
  async (request) => {
    const referrerId = request.auth?.uid;
    if (!referrerId) {
      throw new HttpsError("unauthenticated", "Sign in first.");
    }

    const referredTenantId = request.data?.referredTenantId?.trim();
    if (!referredTenantId) {
      throw new HttpsError("invalid-argument", "Enter a tenant ID.");
    }
    if (referredTenantId === referrerId) {
      throw new HttpsError("invalid-argument", "You can't refer yourself.");
    }

    const referredSnap = await db.collection("users").doc(referredTenantId).get();
    const referredUser = referredSnap.data() as UserDoc | undefined;
    if (!referredSnap.exists || !referredUser || referredUser.role !== "tenant") {
      throw new HttpsError("not-found", "No tenant found with that ID.");
    }

    const ref = db.collection("reputationScores").doc(referrerId);
    const referralRef = db.collection("referrals").doc();
    const [activeLeaseCount, docsSubmitted] = await Promise.all([
      countActiveLeases(referrerId),
      countDocsSubmitted(referrerId),
    ]);
    const quarterKey = currentQuarterKey();

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const existing = snap.exists ? (snap.data() as ReputationScoreDoc) : undefined;

      if ((existing?.referredTenantIds ?? []).includes(referredTenantId)) {
        throw new HttpsError("already-exists", "You've already referred this tenant.");
      }

      const sameQuarter = existing?.referralQuarterKey === quarterKey;
      const referralsThisQuarter = sameQuarter ? existing?.referralsThisQuarter ?? 0 : 0;
      if (referralsThisQuarter >= REFERRAL_QUARTERLY_CAP) {
        throw new HttpsError("resource-exhausted", "You've reached the 5-referral limit for this quarter.");
      }

      const taskBonusPoints = (existing?.taskBonusPoints ?? 0) + REFERRAL_CREDIT_POINTS;
      const raw = computeScore(
        existing?.onTimeCount ?? 0,
        existing?.lateCount ?? 0,
        existing?.currentStreak ?? 0,
        activeLeaseCount,
        docsSubmitted,
        taskBonusPoints,
      );
      const score = hasResidentBadge(existing?.badges)
        ? Math.max(raw, residentFloor(activeLeaseCount, docsSubmitted))
        : raw;

      const fields = {
        taskBonusPoints,
        score,
        referralQuarterKey: quarterKey,
        referralsThisQuarter: referralsThisQuarter + 1,
        referredTenantIds: [...(existing?.referredTenantIds ?? []), referredTenantId],
      };

      if (existing) {
        tx.update(ref, fields);
      } else {
        const baseline: ReputationScoreDoc = {
          tenantId: referrerId,
          onTimeCount: 0,
          lateCount: 0,
          totalCount: 0,
          currentStreak: 0,
          badges: [],
          ...fields,
        };
        tx.set(ref, baseline);
      }

      tx.set(referralRef, {
        id: referralRef.id,
        referrerId,
        referredTenantId,
        createdAt: Date.now(),
      });
    });

    return { referredDisplayName: referredUser.displayName };
  },
);
