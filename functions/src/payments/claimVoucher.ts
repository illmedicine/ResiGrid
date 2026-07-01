import { randomUUID } from "crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "../lib/firebaseAdmin";
import { getSquareClientForAccessToken, toMoneyCents } from "../lib/square";
import { recordCompletedPayment } from "./recordPayment";
import type { SquareConnectionDoc, VoucherDoc } from "../types";

interface ClaimResult {
  voucherId: string;
  /** True when this was the claiming PM's first time — redirect them to onboarding. */
  newInvitePM: boolean;
}

/** Charges the voucher's saved card-on-file into the claiming user's
 * connected Square account. Shared by the `claimVoucher` callable and the
 * OAuth callback's auto-claim path. */
export async function claimVoucherForUid(uid: string, claimToken: string): Promise<ClaimResult> {
  const voucherSnap = await db
    .collection("vouchers")
    .where("claimToken", "==", claimToken)
    .limit(1)
    .get();
  const voucherDoc = voucherSnap.docs[0];
  if (!voucherDoc) {
    throw new HttpsError("not-found", "This claim link is invalid.");
  }
  const voucher = voucherDoc.data() as VoucherDoc;

  if (voucher.status !== "pending") {
    throw new HttpsError("failed-precondition", `Voucher already ${voucher.status}.`);
  }
  if (voucher.expiresAt < Date.now()) {
    await voucherDoc.ref.update({ status: "expired" });
    throw new HttpsError("failed-precondition", "This claim link has expired.");
  }
  if (!voucher.squareCustomerId || !voucher.squareCardId) {
    throw new HttpsError("internal", "Voucher is missing saved payment details.");
  }

  const connSnap = await db.collection("squareConnections").doc(uid).get();
  if (!connSnap.exists) {
    throw new HttpsError(
      "failed-precondition",
      "Connect a Square account before claiming this voucher.",
    );
  }
  const connection = connSnap.data() as SquareConnectionDoc;

  const recipientClient = getSquareClientForAccessToken(connection.accessToken);
  let squarePaymentId: string;
  try {
    const result = await recipientClient.paymentsApi.createPayment({
      sourceId: voucher.squareCardId,
      customerId: voucher.squareCustomerId,
      idempotencyKey: randomUUID(),
      amountMoney: toMoneyCents(voucher.amount),
      locationId: connection.locationId,
    });
    const paymentId = result.result.payment?.id;
    if (!paymentId) throw new Error("Square did not return a payment ID.");
    squarePaymentId = paymentId;
  } catch (err) {
    throw new HttpsError(
      "aborted",
      err instanceof Error ? err.message : "Unable to charge the saved card.",
    );
  }

  await voucherDoc.ref.update({
    status: "paid_out",
    recipientUserId: uid,
    squarePaymentId,
  });

  await recordCompletedPayment({
    tenantId: voucher.senderId,
    amount: voucher.amount,
    voucherId: voucherDoc.id,
    leaseId: voucher.leaseId,
  });

  // If this PM has no subscription doc yet, grant them free portal access
  // as an invited landlord. This bypasses the $40 onboarding fee — the
  // payment they just claimed IS their activation event.
  const now = Date.now();
  const subRef = db.collection("pmSubscriptions").doc(uid);
  const existingSub = await subRef.get();
  let newInvitePM = false;

  if (!existingSub.exists) {
    await subRef.set({
      uid,
      active: true,
      entitlements: [],
      totalPaid: 0,
      invitedVia: voucherDoc.id,
      updatedAt: now,
    });
    newInvitePM = true;
  }

  return { voucherId: voucherDoc.id, newInvitePM };
}

interface ClaimVoucherRequest {
  claimToken: string;
}

interface ClaimVoucherResponse {
  voucherId: string;
  newInvitePM: boolean;
}

/** Claims a voucher for a recipient who already has Square connected —
 * no OAuth round-trip needed. */
export const claimVoucher = onCall<ClaimVoucherRequest, Promise<ClaimVoucherResponse>>(
  { region: "us-central1", cors: ["https://resigrid.co", "https://www.resigrid.co", "http://localhost:3000"] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in to claim this payment.");
    if (!request.data.claimToken) {
      throw new HttpsError("invalid-argument", "Missing claim token.");
    }
    const result = await claimVoucherForUid(uid, request.data.claimToken);
    return result;
  },
);
