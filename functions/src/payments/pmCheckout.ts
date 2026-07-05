import { randomUUID } from "crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { db } from "../lib/firebaseAdmin";
import {
  getSquareClient,
  getSquareLocationId,
  toMoneyCents,
  SQUARE_SECRETS,
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
  propertyName?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zip?: string;
  unitCount?: number;
}

interface CreatePMSubscriptionResponse {
  propertyId?: string;
  amountCharged: number;
}

export const createPMSubscription = onCall<
  CreatePMSubscriptionRequest,
  Promise<CreatePMSubscriptionResponse>
>(
  { region: "us-central1", cors: true, secrets: [...SQUARE_SECRETS] },
  async (request) => {
    const pmId = request.auth?.uid;
    if (!pmId) {
      throw new HttpsError("unauthenticated", "Sign in first.");
    }

    const { sourceId, tier, propertyName, addressLine1, city, state, zip, unitCount } =
      request.data;

    if (!sourceId) {
      throw new HttpsError("invalid-argument", "Missing payment source.");
    }
    if (!isValidTier(tier)) {
      throw new HttpsError("invalid-argument", "Invalid tier. Choose starter, growth, or mega.");
    }

    const hasProperty = !!(propertyName && addressLine1 && city && state && zip);
    const units = Math.max(1, Math.floor(unitCount ?? 1));
    const feeUsd = TIER_FEES[tier];
    const now = Date.now();

    // ── Save card on file for recurring billing, then charge it ──────
    let squarePaymentId: string;
    let squareCustomerId: string | undefined;
    let squareCardId: string | undefined;

    try {
      const client = getSquareClient();

      // Fetch PM user doc for display name / email.
      const userSnap = await db.collection("users").doc(pmId).get();
      const userData = userSnap.data();

      // Create or locate a Square Customer for this PM.
      const customerResult = await client.customersApi.createCustomer({
        idempotencyKey: `customer-${pmId}`,
        emailAddress: userData?.email,
        givenName: userData?.displayName ?? propertyName ?? "Property Manager",
        referenceId: pmId,
      });
      squareCustomerId = customerResult.result.customer?.id;

      // Save the card on file under that customer.
      if (squareCustomerId) {
        try {
          const cardResult = await client.cardsApi.createCard({
            idempotencyKey: randomUUID(),
            sourceId,
            card: { customerId: squareCustomerId },
          });
          squareCardId = cardResult.result.card?.id;
        } catch {
          // Card save failing is non-fatal — we still charge via the nonce.
        }
      }

      // Charge using the saved card if available, otherwise fall back to nonce.
      const chargeSourceId = squareCardId ?? sourceId;
      const result = await client.paymentsApi.createPayment({
        sourceId: chargeSourceId,
        idempotencyKey: randomUUID(),
        amountMoney: toMoneyCents(feeUsd),
        locationId: getSquareLocationId(),
        customerId: squareCustomerId,
        note: `ResiGrid ${TIER_NAMES[tier]} annual onboarding${propertyName ? ` — ${propertyName}` : ""}`,
      });
      const id = result.result.payment?.id;
      if (!id) throw new Error("Square did not return a payment ID.");
      squarePaymentId = id;
    } catch (err) {
      logger.error("createPMSubscription payment step failed", err);
      throw new HttpsError(
        "aborted",
        err instanceof Error ? err.message : "Card was declined.",
      );
    }

    // ── Optionally create a property doc ─────────────────────────────
    let newPropertyId: string | undefined;
    if (hasProperty) {
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
      newPropertyId = propertyRef.id;
    }

    // ── Upsert pmSubscriptions doc with tier + tierExpiresAt ──────────
    const entitlement: PMEntitlement = {
      propertyId: newPropertyId ?? "",
      address: hasProperty ? `${addressLine1}, ${city}, ${state} ${zip}` : "",
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
        ...(squareCustomerId ? { squareCustomerId } : {}),
        ...(squareCardId ? { squareCardId } : {}),
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
        squareCustomerId,
        squareCardId,
      };
      await subRef.set(sub);
    }

    return { propertyId: newPropertyId, amountCharged: feeUsd };
  },
);
