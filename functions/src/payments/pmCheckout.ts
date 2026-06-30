import { randomUUID } from "crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "../lib/firebaseAdmin";
import {
  getSquareClient,
  getSquareLocationId,
  toMoneyCents,
} from "../lib/square";
import type { PMEntitlement, PMSubscriptionDoc } from "../types";

const PM_BASE_FEE = 40;
const PM_EXTRA_UNIT_FEE = 10;

function calculatePropertyFee(unitCount: number): number {
  return PM_BASE_FEE + Math.max(0, unitCount - 1) * PM_EXTRA_UNIT_FEE;
}

interface CreatePMSubscriptionRequest {
  sourceId: string;
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
  { region: "us-central1" },
  async (request) => {
    const pmId = request.auth?.uid;
    if (!pmId) {
      throw new HttpsError("unauthenticated", "Sign in first.");
    }

    const { sourceId, propertyName, addressLine1, city, state, zip, unitCount } =
      request.data;
    if (!sourceId || !propertyName || !addressLine1 || !city || !state || !zip) {
      throw new HttpsError("invalid-argument", "All property fields are required.");
    }
    if (!unitCount || unitCount < 1) {
      throw new HttpsError("invalid-argument", "At least 1 unit is required.");
    }

    const units = Math.max(1, Math.floor(unitCount));
    const feeUsd = calculatePropertyFee(units);

    // ── Charge ResiGrid's own Square account (platform revenue) ──────
    let squarePaymentId: string;
    try {
      const result = await getSquareClient().paymentsApi.createPayment({
        sourceId,
        idempotencyKey: randomUUID(),
        amountMoney: toMoneyCents(feeUsd),
        locationId: getSquareLocationId(),
        note: `ResiGrid PM onboarding — ${propertyName} (${units} unit${units > 1 ? "s" : ""})`,
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

    // ── Create property doc (admin SDK, bypasses client-side rules) ──
    const propertyRef = db.collection("properties").doc();
    const now = Date.now();

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

    // ── Upsert pmSubscriptions doc ───────────────────────────────────
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
        entitlements: [...(data.entitlements ?? []), entitlement],
        totalPaid: (data.totalPaid ?? 0) + feeUsd,
        updatedAt: now,
      });
    } else {
      const sub: PMSubscriptionDoc = {
        uid: pmId,
        active: true,
        entitlements: [entitlement],
        totalPaid: feeUsd,
        updatedAt: now,
      };
      await subRef.set(sub);
    }

    return { propertyId: propertyRef.id, amountCharged: feeUsd };
  },
);
