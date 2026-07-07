import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../lib/firebaseAdmin";
import type { PMSubscriptionDoc, UserDoc } from "../types";

// ── Grid Early Adopter promotion ──────────────────────────────────────────────
// The first TOTAL_SLOTS *new* property managers get their first year free
// (no annual onboarding fee — just the standard $1/mo per occupied unit).
// Existing PMs (anyone who already has a pmSubscriptions doc) can't claim.
// Slot count lives at promotions/gridEarlyAdopter so the public landing page
// can show a live "spots remaining" counter.

export const PROMO_ID = "gridEarlyAdopter";
export const PROMO_NAME = "grid_early_adopter";
export const TOTAL_SLOTS = 50;
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const REVOCATION_GRACE_MS = 30 * 24 * 60 * 60 * 1000;

function promoRef() {
  return db.collection("promotions").doc(PROMO_ID);
}

/** Grants the promo subscription inside a transaction. Shared by the
 * self-serve claim and the admin restore path (admin bypasses the cap). */
async function grantPromo(uid: string, opts: { enforceCap: boolean }): Promise<{ claimed: boolean; reason?: string; remaining: number }> {
  return db.runTransaction(async (tx) => {
    const subRef = db.collection("pmSubscriptions").doc(uid);
    const [subSnap, promoSnap] = await Promise.all([tx.get(subRef), tx.get(promoRef())]);

    const claimedCount: number = promoSnap.exists ? (promoSnap.data()?.claimedCount ?? 0) : 0;
    const existing = subSnap.exists ? (subSnap.data() as PMSubscriptionDoc) : null;

    // Already onboarded (paid or promo) — nothing to claim, unless an admin
    // is restoring a revoked promo on the existing subscription.
    if (existing && !(existing.promo === PROMO_NAME && existing.promoRevokedAt)) {
      if (existing.promo === PROMO_NAME) {
        return { claimed: false, reason: "already_claimed", remaining: Math.max(0, TOTAL_SLOTS - claimedCount) };
      }
      return { claimed: false, reason: "existing_subscription", remaining: Math.max(0, TOTAL_SLOTS - claimedCount) };
    }

    const isRestore = Boolean(existing);
    if (opts.enforceCap && !isRestore && claimedCount >= TOTAL_SLOTS) {
      return { claimed: false, reason: "promo_full", remaining: 0 };
    }

    const now = Date.now();
    if (isRestore) {
      tx.update(subRef, {
        active: true,
        promoRevokedAt: FieldValue.delete(),
        promoEnforcedAt: FieldValue.delete(),
        updatedAt: now,
      });
      // Revocation freed the slot; restoring re-claims it.
      tx.set(promoRef(), { totalSlots: TOTAL_SLOTS, claimedCount: claimedCount + 1 }, { merge: true });
      return { claimed: true, remaining: Math.max(0, TOTAL_SLOTS - claimedCount - 1) };
    }

    const sub: PMSubscriptionDoc = {
      uid,
      active: true,
      // Mega tier = no property/unit caps — Early Adopters get every feature
      // with no gating for their free year.
      tier: "mega",
      tierExpiresAt: now + YEAR_MS,
      entitlements: [],
      totalPaid: 0,
      updatedAt: now,
      promo: PROMO_NAME,
      promoGrantedAt: now,
    };
    tx.set(subRef, sub);
    tx.set(promoRef(), { totalSlots: TOTAL_SLOTS, claimedCount: claimedCount + 1 }, { merge: true });
    return { claimed: true, remaining: Math.max(0, TOTAL_SLOTS - claimedCount - 1) };
  });
}

export const claimEarlyAdopterPromo = onCall(
  { region: "us-central1", cors: ["https://resigrid.co", "https://www.resigrid.co", "http://localhost:3000"] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");

    const userSnap = await db.collection("users").doc(uid).get();
    const user = userSnap.data() as UserDoc | undefined;
    if (user?.role !== "property_manager") {
      throw new HttpsError("failed-precondition", "Only property manager accounts can claim this promotion.");
    }

    const result = await grantPromo(uid, { enforceCap: true });
    if (result.claimed) {
      logger.info("claimEarlyAdopterPromo: slot claimed", { uid, remaining: result.remaining });
    }
    return result;
  },
);

/** Revokes the promo (called from the admin portal). Access continues for a
 * 30-day grace period, after which enforcePromoRevocations purges the
 * account's property data and demotes the user. Frees the slot immediately. */
export async function revokePromo(uid: string): Promise<void> {
  await db.runTransaction(async (tx) => {
    const subRef = db.collection("pmSubscriptions").doc(uid);
    const [subSnap, promoSnap] = await Promise.all([tx.get(subRef), tx.get(promoRef())]);
    if (!subSnap.exists) throw new HttpsError("not-found", "No subscription for that user.");
    const sub = subSnap.data() as PMSubscriptionDoc;
    if (sub.promo !== PROMO_NAME) throw new HttpsError("failed-precondition", "That user is not on the Early Adopter promotion.");
    if (sub.promoRevokedAt) return; // already revoked

    tx.update(subRef, { promoRevokedAt: Date.now(), updatedAt: Date.now() });
    const claimedCount: number = promoSnap.exists ? (promoSnap.data()?.claimedCount ?? 0) : 0;
    tx.set(promoRef(), { totalSlots: TOTAL_SLOTS, claimedCount: Math.max(0, claimedCount - 1) }, { merge: true });
  });
}

export async function restorePromo(uid: string): Promise<void> {
  const result = await grantPromo(uid, { enforceCap: false });
  if (!result.claimed && result.reason !== "already_claimed") {
    throw new HttpsError("failed-precondition", `Could not restore promo: ${result.reason}`);
  }
}

async function deleteQueryBatch(query: FirebaseFirestore.Query): Promise<number> {
  const snap = await query.get();
  let deleted = 0;
  // Chunk into batches of 400 (Firestore batch limit is 500 writes).
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = db.batch();
    for (const doc of snap.docs.slice(i, i + 400)) {
      batch.delete(doc.ref);
      deleted++;
    }
    await batch.commit();
  }
  return deleted;
}

/** Daily: 30 days after an admin revokes the promo, permanently delete the
 * PM's property data and demote the account to tenant (which removes PM
 * portal access via the existing RoleGuard). */
export const enforcePromoRevocations = onSchedule(
  { schedule: "30 7 * * *", region: "us-central1", timeoutSeconds: 540 },
  async () => {
    const now = Date.now();
    const snap = await db.collection("pmSubscriptions").where("promoRevokedAt", ">", 0).get();

    for (const subDoc of snap.docs) {
      const sub = subDoc.data() as PMSubscriptionDoc;
      if (sub.promoEnforcedAt) continue;
      if (!sub.promoRevokedAt || now < sub.promoRevokedAt + REVOCATION_GRACE_MS) continue;

      const uid = subDoc.id;
      logger.warn(`enforcePromoRevocations: purging property data for ${uid}`);
      try {
        const propsSnap = await db.collection("properties").where("ownerId", "==", uid).get();
        let deletedUnits = 0;
        let deletedListings = 0;
        for (const prop of propsSnap.docs) {
          deletedUnits += await deleteQueryBatch(db.collection("units").where("propertyId", "==", prop.id));
          deletedListings += await deleteQueryBatch(db.collection("listings").where("propertyId", "==", prop.id));
          await prop.ref.delete();
        }
        const deletedLeases = await deleteQueryBatch(db.collection("leaseTerms").where("pmId", "==", uid));

        await db.collection("users").doc(uid).update({ role: "tenant" });
        await subDoc.ref.update({ active: false, promoEnforcedAt: now, updatedAt: now });

        logger.warn(
          `enforcePromoRevocations: ${uid} purged — ${propsSnap.size} properties, ${deletedUnits} units, ${deletedListings} listings, ${deletedLeases} leases; role set to tenant`,
        );
      } catch (err) {
        logger.error(`enforcePromoRevocations: failed for ${uid}`, err);
      }
    }
  },
);
