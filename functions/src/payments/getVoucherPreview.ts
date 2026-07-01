import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "../lib/firebaseAdmin";
import type { UserDoc, VoucherDoc } from "../types";

interface VoucherPreviewRequest {
  claimToken: string;
}

interface VoucherPreviewResponse {
  amount: number;
  senderName: string;
  status: VoucherDoc["status"];
}

/** Public-safe voucher lookup by claim token — used to render the claim
 * page before the recipient has signed in. Deliberately excludes anything
 * sensitive (card/customer references, sender contact info). */
export const getVoucherPreview = onCall<VoucherPreviewRequest, Promise<VoucherPreviewResponse>>(
  { region: "us-central1", cors: ["https://resigrid.co", "https://www.resigrid.co", "http://localhost:3000"] },
  async (request) => {
    const { claimToken } = request.data;
    if (!claimToken) {
      throw new HttpsError("invalid-argument", "Missing claim token.");
    }

    const snap = await db
      .collection("vouchers")
      .where("claimToken", "==", claimToken)
      .limit(1)
      .get();
    const voucherDoc = snap.docs[0];
    if (!voucherDoc) {
      throw new HttpsError("not-found", "This claim link is invalid.");
    }
    const voucher = voucherDoc.data() as VoucherDoc;

    const senderSnap = await db.collection("users").doc(voucher.senderId).get();
    const sender = senderSnap.data() as UserDoc | undefined;

    return {
      amount: voucher.amount,
      senderName: sender?.displayName ?? "A ResiGrid tenant",
      status: voucher.status,
    };
  },
);
