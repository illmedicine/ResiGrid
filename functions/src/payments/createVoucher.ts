import { randomUUID } from "crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { db } from "../lib/firebaseAdmin";
import {
  friendlySquareError,
  getSquareClient,
  getSquareClientForAccessToken,
  toMoneyCents,
  SQUARE_SECRETS,
} from "../lib/square";
import { recordCompletedPayment } from "./recordPayment";
import { notifyVoucherRecipient, SMTP_SECRETS } from "../lib/mailer";
import type { UserDoc, VoucherDoc, SquareConnectionDoc } from "../types";

const CLAIM_BASE_URL = process.env.CLAIM_BASE_URL ?? "https://resigrid.co/claim/";
const VOUCHER_EXPIRY_DAYS = 14;

interface CreateVoucherRequest {
  amount: number;
  /** PM's UID — preferred; skips email search when provided. */
  pmId?: string;
  /** Recipient email or phone — used when pmId is absent (pay-anyone flow). */
  recipientContact?: string;
  sourceId: string;
  /** ID in the `leases` collection (legacy assign-tenant path). */
  leaseId?: string;
  /** ID in the `leaseTerms` collection (lease builder path). */
  leaseTermsId?: string;
  /** ID in the `rentInvoices` collection — set when paying a specific due invoice. */
  invoiceId?: string;
}

interface CreateVoucherResponse {
  voucherId: string;
  status: VoucherDoc["status"];
  claimUrl?: string;
}

export const createVoucher = onCall<CreateVoucherRequest, Promise<CreateVoucherResponse>>(
  { region: "us-central1", cors: ["https://resigrid.co", "https://www.resigrid.co", "http://localhost:3000"], secrets: [...SQUARE_SECRETS, ...SMTP_SECRETS] },
  async (request) => {
    const senderId = request.auth?.uid;
    if (!senderId) {
      throw new HttpsError("unauthenticated", "Sign in to make a payment.");
    }

    const { amount, pmId, recipientContact, sourceId, leaseId, leaseTermsId, invoiceId } = request.data;
    if (!amount || amount <= 0) {
      throw new HttpsError("invalid-argument", "Amount must be greater than 0.");
    }
    if (!pmId && !recipientContact) {
      throw new HttpsError("invalid-argument", "Provide a recipient (PM ID or contact).");
    }
    if (!sourceId) {
      throw new HttpsError("invalid-argument", "Missing card details.");
    }

    // Resolve the recipient — prefer direct UID lookup, fall back to email search.
    let recipientUserId: string | undefined;
    let recipientUser: UserDoc | undefined;
    let effectiveRecipientContact = recipientContact ?? "";

    if (pmId) {
      const userSnap = await db.collection("users").doc(pmId).get();
      if (userSnap.exists) {
        recipientUserId = pmId;
        recipientUser = userSnap.data() as UserDoc;
        effectiveRecipientContact = recipientUser.email;
      }
    } else if (recipientContact) {
      const recipientSnap = await db
        .collection("users")
        .where("email", "==", recipientContact)
        .limit(1)
        .get();
      const recipientDoc = recipientSnap.docs[0];
      if (recipientDoc) {
        recipientUserId = recipientDoc.id;
        recipientUser = recipientDoc.data() as UserDoc;
      }
    }

    // Check if the recipient PM has Square connected.
    let recipientConnection: SquareConnectionDoc | undefined;
    if (recipientUser?.role === "property_manager" && recipientUserId) {
      const connSnap = await db.collection("squareConnections").doc(recipientUserId).get();
      recipientConnection = connSnap.exists ? (connSnap.data() as SquareConnectionDoc) : undefined;
    }

    const now = Date.now();
    const voucherRef = db.collection("vouchers").doc();

    if (recipientConnection) {
      // PM is connected — charge straight into their Square account.
      // Square pays them out on its normal schedule. No claim step needed.
      const recipientClient = getSquareClientForAccessToken(recipientConnection.accessToken);
      let squarePaymentId: string;
      try {
        const result = await recipientClient.paymentsApi.createPayment({
          sourceId,
          idempotencyKey: randomUUID(),
          amountMoney: toMoneyCents(amount),
          locationId: recipientConnection.locationId,
        });
        const paymentId = result.result.payment?.id;
        if (!paymentId) throw new Error("Square did not return a payment ID.");
        squarePaymentId = paymentId;
      } catch (err) {
        throw new HttpsError("aborted", friendlySquareError(err, "Card was declined."));
      }

      const voucher: VoucherDoc = {
        id: voucherRef.id,
        senderId,
        recipientContact: effectiveRecipientContact,
        recipientUserId,
        amount,
        squarePaymentId,
        status: "paid_out",
        claimToken: randomUUID(),
        createdAt: now,
        expiresAt: now,
        ...(leaseId ? { leaseId } : {}),
        ...(leaseTermsId ? { leaseTermsId } : {}),
        ...(invoiceId ? { invoiceId } : {}),
      };
      await voucherRef.set(voucher);
      await recordCompletedPayment({
        tenantId: senderId,
        pmId: recipientUserId,
        amount,
        voucherId: voucherRef.id,
        leaseId,
        leaseTermsId,
        invoiceId,
      });

      return { voucherId: voucherRef.id, status: voucher.status };
    }

    // PM isn't connected yet — save card on file and defer the charge
    // until they claim the voucher (see claimVoucher.ts).
    const platform = getSquareClient();
    let customerId: string;
    let cardId: string;
    try {
      const customerResult = await platform.customersApi.createCustomer({
        idempotencyKey: randomUUID(),
        note: `ResiGrid voucher sender ${senderId}`,
      });
      const newCustomerId = customerResult.result.customer?.id;
      if (!newCustomerId) throw new Error("Square did not return a customer ID.");
      customerId = newCustomerId;

      const cardResult = await platform.cardsApi.createCard({
        idempotencyKey: randomUUID(),
        sourceId,
        card: { customerId },
      });
      const newCardId = cardResult.result.card?.id;
      if (!newCardId) throw new Error("Square did not return a card ID.");
      cardId = newCardId;
    } catch (err) {
      throw new HttpsError("aborted", friendlySquareError(err, "Unable to save card for payment."));
    }

    const claimToken = randomUUID();
    const voucher: VoucherDoc = {
      id: voucherRef.id,
      senderId,
      recipientContact: effectiveRecipientContact,
      recipientUserId,
      amount,
      squareCustomerId: customerId,
      squareCardId: cardId,
      status: "pending",
      claimToken,
      createdAt: now,
      expiresAt: now + VOUCHER_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    };
    await voucherRef.set(voucher);

    if (leaseId) await voucherRef.update({ leaseId });
    if (leaseTermsId) await voucherRef.update({ leaseTermsId });
    if (invoiceId) await voucherRef.update({ invoiceId });
    if (pmId) await voucherRef.update({ recipientUserId: pmId });

    // Notify the recipient — non-fatal so the payment always succeeds.
    try {
      const senderSnap = await db.collection("users").doc(senderId).get();
      const senderName =
        (senderSnap.data() as UserDoc | undefined)?.displayName ?? "Your tenant";
      await notifyVoucherRecipient({
        recipientContact: effectiveRecipientContact,
        senderName,
        amountUsd: amount,
        claimToken,
      });
    } catch (err) {
      logger.warn("Failed to send voucher invite notification", { error: String(err) });
    }

    return {
      voucherId: voucherRef.id,
      status: voucher.status,
      claimUrl: `${CLAIM_BASE_URL}?token=${claimToken}`,
    };
  },
);
