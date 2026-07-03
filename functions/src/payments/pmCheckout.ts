import { randomUUID } from "crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "../lib/firebaseAdmin";
import {
  getSquareClient,
  getSquareLocationId,
  toMoneyCents,
} from "../lib/square";
import type { PMEntitlement, PMSubscriptionDoc, PMTier } from "../types";

const TIER_FEES: Record<PMTier, number> = {
  starter: 40,
  growth: 80,
  mega: 400,
};

const TIER_NAMES: Record<PMTier, string> = {
  starter: "Starter Grid",
  growth: "Growth Grid",
  mega: "Mega Grid",
};

const MS_PER_YEAR = 365 * 24 * 60 * 60 * 1000;

function isValidTier(t: unknown): t is PMTier {
  return t === "starter" || t === "growth" || t === "mega";
}

interface CreatePMSubscriptionRequest {
  sourceId: string;
  tier: PMTier;
  propertyName: string;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  unitCount: number;
}

interface CreatePMSubscriptionResponse {
  propertyId: string;
  amountCharged: number;
}

export const createPMSubscription = onCall<
  CreatePMSubscriptionRequest,
  Promise<CreatePMSubscriptionResponse>
>(
  { region: "us-central1", cors: true },
  async (request) => {
    const pmId = request.auth?.uid;
    if (!pmId) {
      throw new HttpsError("unauthenticated", "Sign in first.");
    }

    const { sourceId, tier, propertyName, addressLine1, city, state, zip, unitCount } =
      request.data;

    if (!sourceId || !propertyName || !addressLine1 || !city || !state || !zip) {
      throw new HttpsError("invalid-argument", "All property fields are required.");
    }
    if (!isValidTier(tier)) {
      throw new HttpsError("invalid-argument", "Invalid tier. Choose starter, growth, or mega.");
    }
    if (!unitCount || unitCount < 1) {
      throw new HttpsError("invalid-argument", "At least 1 unit is required.");
    }

    const units = Math.max(1, Math.floor(unitCount));
    const feeUsd = TIER_FEES[tier];
    const now = Date.now();

    // ── Charge ResiGrid's own Square account (annual tier fee) ────────
    let squarePaymentId: string;
    try {
      const result = await getSquareClient().paymentsApi.createPayment({
        sourceId,
        idempotencyKey: randomUUID(),
        amountMoney: toMoneyCents(feeUsd),
        locationId: getSquareLocationId(),
        note: `ResiGrid ${TIER_NAMES[tier]} annual onboarding — ${propertyName}`,
      });
      const id = result.result.payment?.id;
      if (!id) throw new Error("Square did not return a payment ID.");
      squarePaymentId = id;
    } catch (err) {
      throw new HttpsError(
        "aborted",
        err instanceof Error ? err.message : "Card was declined.",
      );
    }

    // ── Create first property doc ─────────────────────────────────────
    const propertyRef = db.collection("properties").doc();

    await propertyRef.set({
      id: propertyRef.id,
      ownerId: pmId,
      name: propertyName,
      addressLine1,
      city,
      state,
      zip,
      photos: [],
      amenities: [],
      unitIds: [],
      createdAt: now,
    });

    // ── Upsert pmSubscriptions doc with tier + tierExpiresAt ──────────
    const entitlement: PMEntitlement = {
      propertyId: propertyRef.id,
      address: `${addressLine1}, ${city}, ${state} ${zip}`,
      paidUnits: units,
      squarePaymentId,
      amountPaid: feeUsd,
      paidAt: now,
    };

    const subRef = db.collection("pmSubscriptions").doc(pmId);
    const existing = await subRef.get();

    if (existing.exists) {
      const data = existing.data() as PMSubscriptionDoc;
      await subRef.update({
        active: true,
        tier,
        tierExpiresAt: now + MS_PER_YEAR,
        entitlements: [...(data.entitlements ?? []), entitlement],
        totalPaid: (data.totalPaid ?? 0) + feeUsd,
        updatedAt: now,
      });
    } else {
      const sub: PMSubscriptionDoc = {
        uid: pmId,
        active: true,
        tier,
        tierExpiresAt: now + MS_PER_YEAR,
        entitlements: [entitlement],
        totalPaid: feeUsd,
        updatedAt: now,
      };
      await subRef.set(sub);
    }

    return { propertyId: propertyRef.id, amountCharged: feeUsd };
  },
);
