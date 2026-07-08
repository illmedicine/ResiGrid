import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { db } from "../lib/firebaseAdmin";
import { recordCompletedPayment } from "./recordPayment";
import type { ExternalPaymentClaimDoc, UserDoc } from "../types";

/** PM confirms (or declines) a tenant's report of a payment made outside
 * ResiGrid — PayPal, Cash App, Venmo, Chime, Zelle. Money never moved
 * through the platform, so nothing is recorded until the PM attests they
 * actually received it; on confirm this creates a real completed `payments`
 * record, which flows through the same invoice matching, receipt filing,
 * and RGE scoring as card payments. */
export const confirmExternalPayment = onCall<{ claimId: string; approve: boolean }>(
  { region: "us-central1", cors: ["https://resigrid.co", "https://www.resigrid.co", "http://localhost:3000"] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");
    const { claimId, approve } = request.data;
    if (!claimId || typeof approve !== "boolean") {
      throw new HttpsError("invalid-argument", "Provide a claimId and approve flag.");
    }

    const claimRef = db.collection("externalPaymentClaims").doc(claimId);
    const claimSnap = await claimRef.get();
    if (!claimSnap.exists) throw new HttpsError("not-found", "Payment report not found.");
    const claim = claimSnap.data() as ExternalPaymentClaimDoc;

    // Only the receiving PM (or their team member) can resolve the claim.
    if (claim.pmId !== uid) {
      const callerSnap = await db.collection("users").doc(uid).get();
      const caller = callerSnap.data() as UserDoc & { teamAdminId?: string } | undefined;
      if (caller?.teamAdminId !== claim.pmId) {
        throw new HttpsError("permission-denied", "Only the receiving property manager can confirm this payment.");
      }
    }
    if (claim.status !== "pending") {
      throw new HttpsError("failed-precondition", `This payment report was already ${claim.status}.`);
    }

    const now = Date.now();
    if (!approve) {
      await claimRef.update({ status: "declined", resolvedAt: now });
      return { ok: true, status: "declined" };
    }

    const paymentId = await recordCompletedPayment({
      tenantId: claim.tenantId,
      pmId: claim.pmId,
      amount: claim.amount,
      leaseTermsId: claim.leaseTermsId,
      invoiceId: claim.invoiceId,
      method: "external",
      externalMethod: claim.method,
    });
    await claimRef.update({ status: "confirmed", resolvedAt: now, paymentId });
    logger.info("confirmExternalPayment: confirmed", { claimId, paymentId, by: uid });
    return { ok: true, status: "confirmed", paymentId };
  },
);
