import { randomUUID } from "crypto";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { db } from "../lib/firebaseAdmin";
import { getSquareClient, getSquareLocationId, toMoneyCents } from "../lib/square";
import type { PMSubscriptionDoc } from "../types";

// ── Monthly per-unit billing ──────────────────────────────────────────────────
// Runs at 08:00 UTC on the 1st of every month.
// For each active PM with a card on file, counts occupied units and charges
// $1 × occupiedUnits to ResiGrid's Square account.

export const billMonthlyUnits = onSchedule(
  { schedule: "0 8 1 * *", region: "us-central1", timeoutSeconds: 540 },
  async () => {
    const snap = await db.collection("pmSubscriptions")
      .where("active", "==", true)
      .get();

    logger.info(`billMonthlyUnits: processing ${snap.docs.length} active subscriptions`);

    for (const subDoc of snap.docs) {
      const sub = subDoc.data() as PMSubscriptionDoc;
      if (!sub.squareCustomerId || !sub.squareCardId) {
        logger.info(`billMonthlyUnits: skipping ${sub.uid} — no card on file`);
        continue;
      }

      try {
        // Count occupied units across all properties owned by this PM.
        const unitsSnap = await db.collection("units")
          .where("status", "==", "occupied")
          .get();

        // Filter to units whose propertyId is owned by this PM.
        const propSnap = await db.collection("properties")
          .where("ownerId", "==", sub.uid)
          .get();
        const ownedPropertyIds = new Set(propSnap.docs.map((d) => d.id));
        const occupiedCount = unitsSnap.docs.filter((d) =>
          ownedPropertyIds.has(d.data().propertyId),
        ).length;

        if (occupiedCount === 0) {
          logger.info(`billMonthlyUnits: ${sub.uid} has 0 occupied units — no charge`);
          continue;
        }

        const amountUsd = occupiedCount; // $1/unit
        const result = await getSquareClient().paymentsApi.createPayment({
          sourceId: sub.squareCardId,
          idempotencyKey: `monthly-${sub.uid}-${new Date().toISOString().slice(0, 7)}`,
          amountMoney: toMoneyCents(amountUsd),
          locationId: getSquareLocationId(),
          customerId: sub.squareCustomerId,
          note: `ResiGrid monthly — ${occupiedCount} occupied unit${occupiedCount !== 1 ? "s" : ""}`,
        });

        const paymentId = result.result.payment?.id;
        logger.info(`billMonthlyUnits: charged ${sub.uid} $${amountUsd} (${occupiedCount} units) — ${paymentId}`);

        // Record the billing event on the subscription doc.
        await subDoc.ref.update({
          lastMonthlyBilledAt: Date.now(),
          lastMonthlyOccupiedUnits: occupiedCount,
          lastMonthlyPaymentId: paymentId,
          updatedAt: Date.now(),
        });
      } catch (err) {
        logger.error(`billMonthlyUnits: failed for ${sub.uid}`, err);
      }
    }

    logger.info("billMonthlyUnits: complete");
  },
);

// ── Annual subscription renewal ───────────────────────────────────────────────
// Runs daily at 09:00 UTC.
// Within 30 days of expiry: sends a renewal reminder (TODO: email integration).
// On/after expiry: attempts renewal charge; deactivates subscription on failure.

const MS_30_DAYS = 30 * 24 * 60 * 60 * 1000;
const MS_PER_YEAR = 365 * 24 * 60 * 60 * 1000;

const TIER_FEES: Record<string, number> = { starter: 40, growth: 80, mega: 400 };
const TIER_NAMES: Record<string, string> = {
  starter: "Starter Grid",
  growth: "Growth Grid",
  mega: "Mega Grid",
};

export const renewAnnualSubscriptions = onSchedule(
  { schedule: "0 9 * * *", region: "us-central1", timeoutSeconds: 540 },
  async () => {
    const now = Date.now();
    const snap = await db.collection("pmSubscriptions")
      .where("active", "==", true)
      .get();

    for (const subDoc of snap.docs) {
      const sub = subDoc.data() as PMSubscriptionDoc;
      if (!sub.tierExpiresAt || !sub.tier) continue;

      const msUntilExpiry = sub.tierExpiresAt - now;

      // Reminder window: 30 days before expiry (but not yet expired).
      if (msUntilExpiry > 0 && msUntilExpiry <= MS_30_DAYS) {
        logger.info(`renewAnnualSubscriptions: renewal reminder due for ${sub.uid} — expires in ${Math.ceil(msUntilExpiry / 86400000)} days`);
        // TODO: send reminder email via mailer once SMTP env vars are configured.
        continue;
      }

      // Renewal: subscription has expired (or is at expiry).
      if (msUntilExpiry <= 0) {
        if (!sub.squareCustomerId || !sub.squareCardId) {
          logger.warn(`renewAnnualSubscriptions: ${sub.uid} expired but has no card on file — deactivating`);
          await subDoc.ref.update({ active: false, updatedAt: now });
          continue;
        }

        const feeUsd = TIER_FEES[sub.tier] ?? 40;
        try {
          const result = await getSquareClient().paymentsApi.createPayment({
            sourceId: sub.squareCardId,
            idempotencyKey: `renew-${sub.uid}-${sub.tierExpiresAt}`,
            amountMoney: toMoneyCents(feeUsd),
            locationId: getSquareLocationId(),
            customerId: sub.squareCustomerId,
            note: `ResiGrid ${TIER_NAMES[sub.tier] ?? sub.tier} annual renewal`,
          });

          const paymentId = result.result.payment?.id;
          await subDoc.ref.update({
            active: true,
            tierExpiresAt: now + MS_PER_YEAR,
            updatedAt: now,
            lastRenewalPaymentId: paymentId,
          });
          logger.info(`renewAnnualSubscriptions: renewed ${sub.uid} — ${paymentId}`);
        } catch (err) {
          logger.error(`renewAnnualSubscriptions: renewal charge failed for ${sub.uid}`, err);
          // Grace period: give 7 days before deactivating.
          const expiredDaysAgo = Math.abs(msUntilExpiry) / 86400000;
          if (expiredDaysAgo >= 7) {
            await subDoc.ref.update({ active: false, updatedAt: now });
            logger.warn(`renewAnnualSubscriptions: deactivated ${sub.uid} after 7-day grace period`);
          }
        }
      }
    }

    logger.info("renewAnnualSubscriptions: complete");
  },
);
