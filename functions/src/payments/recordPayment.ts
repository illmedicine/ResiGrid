import { db } from "../lib/firebaseAdmin";
import type { LeaseDoc, PaymentDoc } from "../types";

interface RecordPaymentParams {
  tenantId: string;
  pmId?: string;
  amount: number;
  voucherId: string;
  leaseId?: string;
  leaseTermsId?: string;
}

/** Writes a `payments` doc once money has actually moved (not before). */
export async function recordCompletedPayment(params: RecordPaymentParams): Promise<void> {
  const { tenantId, pmId, amount, voucherId, leaseId, leaseTermsId } = params;
  const now = Date.now();
  const dayOfMonth = new Date(now).getDate();

  let onTime: boolean | undefined;
  if (leaseId) {
    const leaseSnap = await db.collection("leases").doc(leaseId).get();
    const lease = leaseSnap.data() as LeaseDoc | undefined;
    if (lease) onTime = dayOfMonth <= lease.dueDay;
  } else if (leaseTermsId) {
    // LeaseTermsDoc uses lateFeeDays (grace period after the 1st). Treat due day as 1.
    const leaseSnap = await db.collection("leaseTerms").doc(leaseTermsId).get();
    const lease = leaseSnap.data() as { lateFeeDays?: number } | undefined;
    const graceDay = (lease?.lateFeeDays ?? 5) + 1;
    onTime = dayOfMonth <= graceDay;
  }

  const payment: PaymentDoc = {
    id: "",
    leaseId,
    leaseTermsId,
    tenantId,
    pmId,
    amount,
    method: "voucher",
    status: "completed",
    paidDate: now,
    onTime,
    voucherId,
  };
  await db.collection("payments").add(payment);
}
