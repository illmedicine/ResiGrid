import { randomUUID } from "crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { db } from "../lib/firebaseAdmin";
import {
  getSquareClient,
  getSquareClientForAccessToken,
  toMoneyCents,
} from "../lib/square";
import { recordCompletedPayment } from "./recordPayment";
import { notifyVoucherRecipient } from "../lib/mailer";
import type { UserDoc, VoucherDoc, SquareConnectionDoc } from "../types";

const CLAIM_BASE_URL = process.env.CLAIM_BASE_URL ?? "https://resigrid.co/claim/";
const VOUCHER_EXPIRY_DAYS = 14;

interface CreateVoucherRequest {
  amount: number;
  recipientContact: string;
  sourceId: string;
  leaseId?: string;
}

interface CreateVoucherResponse {
  voucherId: string;
  status: VoucherDoc["status"];
  claimUrl?: string;
}

export const createVoucher = onCall<CreateVoucherRequest, Promise<CreateVoucherResponse>>(
  { region: "us-central1", cors: ["https://resigrid.co", "https://www.resigrid.co", "http://localhost:3000"] },
  async (request) => {
    const senderId = request.auth?.uid;
    if (!senderId) {
      throw new HttpsError("unauthenticated", "Sign in to make a payment.");
    }

    const { amount, recipientContact, sourceId, leaseId } = request.data;
    if (!amount || amount <= 0) {
      throw new HttpsError("invalid-argument", "Amount must be greater than 0.");
    }
    if (!recipientContact || !sourceId) {
      throw new HttpsError("invalid-argument", "Missing recipient or card details.");
    }

    // Is the recipient an existing ResiGrid property manager with Square connected?
    const recipientSnap = await db
      .collection("users")
      .where("email", "==", recipientContact)
      .limit(1)
      .get();
    const recipientDoc = recipientSnap.docs[0];
    const recipientUser = recipientDoc?.data() as UserDoc | undefined;

    let recipientConnection: SquareConnectionDoc | undefined;
    if (recipientUser?.role === "property_manager" && recipientDoc) {
      const connSnap = await db.collection("squareConnections").doc(recipientDoc.id).get();
      recipientConnection = connSnap.exists ? (connSnap.data() as SquareConnectionDoc) : undefined;
    }

    const now = Date.now();
    const voucherRef = db.collection("vouchers").doc();

    if (recipientConnection) {
      // Recipient is connected — charge straight into their Square account
      // so Square pays them out on its normal schedule. No claim step needed.
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
        throw new HttpsError(
          "aborted",
          err instanceof Error ? err.message : "Card was declined.",
        );
      }

      const voucher: VoucherDoc = {
        id: voucherRef.id,
        senderId,
        recipientContact,
        recipientUserId: recipientDoc!.id,
        amount,
        squarePaymentId,
        status: "paid_out",
        claimToken: randomUUID(),
        createdAt: now,
        expiresAt: now,
      };
      await voucherRef.set(voucher);
      await recordCompletedPayment({ tenantId: senderId, amount, voucherId: voucherRef.id, leaseId });

      return { voucherId: voucherRef.id, status: voucher.status };
    }

    // Recipient isn't connected yet — securely save the card on file under
    // ResiGrid's own platform Square account and defer the actual charge
    // until they claim the voucher (see claimVoucher.ts). We never touch
    // raw card data ourselves; Square handles tokenization end-to-end.
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
      throw new HttpsError(
        "aborted",
        err instanceof Error ? err.message : "Unable to save card for payment.",
      );
    }

    const claimToken = randomUUID();
    const voucher: VoucherDoc = {
      id: voucherRef.id,
      senderId,
      recipientContact,
      amount,
      squareCustomerId: customerId,
      squareCardId: cardId,
      status: "pending",
      claimToken,
      createdAt: now,
      expiresAt: now + VOUCHER_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    };
    await voucherRef.set(voucher);

    if (leaseId) {
      await voucherRef.update({ leaseId });
    }

    // Notify the recipient — non-fatal if it fails so the payment always succeeds.
    try {
      const senderSnap = await db.collection("users").doc(senderId).get();
      const senderName =
        (senderSnap.data() as UserDoc | undefined)?.displayName ?? "Your tenant";
      await notifyVoucherRecipient({
        recipientContact,
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
