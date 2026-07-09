import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { creditTaskBonus } from "./recalc";
import type { ReputationScoreDoc, SharedDocumentDoc, TenantReviewDoc } from "../types";

const INSURANCE_CREDIT_POINTS = 30;
const PAYSTUB_CREDIT_POINTS = 15;
const PAYSTUB_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
const REVIEW_CREDIT_POINTS = 25;
const REVIEW_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
const REVIEW_QUALIFYING_RATING = 3;

/** 1x per lease — credited the first time a tenant uploads an insurance
 * policy doc tagged with that lease's leaseTermsId. */
export const awardInsuranceCredit = onDocumentCreated(
  "sharedDocuments/{docId}",
  async (event) => {
    const doc = event.data?.data() as SharedDocumentDoc | undefined;
    if (!doc || doc.category !== "insurance" || !doc.leaseTermsId) return;
    const leaseTermsId = doc.leaseTermsId;

    await creditTaskBonus(doc.tenantId, INSURANCE_CREDIT_POINTS, (existing) => {
      const insuranceLeaseIds = existing?.insuranceLeaseIds ?? [];
      if (insuranceLeaseIds.includes(leaseTermsId)) return null;
      return { insuranceLeaseIds: [...insuranceLeaseIds, leaseTermsId] };
    });
  },
);

/** At most once per rolling 14-day window. */
export const awardPaystubCredit = onDocumentCreated(
  "sharedDocuments/{docId}",
  async (event) => {
    const doc = event.data?.data() as SharedDocumentDoc | undefined;
    if (!doc || doc.category !== "paystub") return;

    await creditTaskBonus(doc.tenantId, PAYSTUB_CREDIT_POINTS, (existing) => {
      const last = existing?.lastPaystubAt;
      if (last !== undefined && Date.now() - last < PAYSTUB_COOLDOWN_MS) return null;
      return { lastPaystubAt: Date.now() };
    });
  },
);

/** A qualifying (3★+) PM review credits RGE at most once per rolling 30 days,
 * regardless of which PM left it — a tenant can have multiple PMs across leases. */
export const awardReviewCredit = onDocumentCreated(
  "tenantReviews/{reviewId}",
  async (event) => {
    const review = event.data?.data() as TenantReviewDoc | undefined;
    if (!review || review.rating < REVIEW_QUALIFYING_RATING) return;

    await creditTaskBonus(review.tenantId, REVIEW_CREDIT_POINTS, (existing: ReputationScoreDoc | undefined) => {
      const last = existing?.lastReviewCreditAt;
      if (last !== undefined && Date.now() - last < REVIEW_COOLDOWN_MS) return null;
      return { lastReviewCreditAt: Date.now() };
    });
  },
);
