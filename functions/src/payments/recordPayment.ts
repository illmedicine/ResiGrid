import { db } from "../lib/firebaseAdmin";
import type { LeaseDoc, PaymentDoc } from "../types";

/** Writes a `payments` doc once money has actually moved (not before). */
export async function recordCompletedPayment(params: {
  tenantId: string;
  amount: number;
  voucherId: string;
  leaseId?: string;
}): Promise<void> {
  const { tenantId, amount, voucherId, leaseId } = params;
  const now = Date.now();

  let onTime: boolean | undefined;
  if (leaseId) {
    const leaseSnap = await db.collection("leases").doc(leaseId).get();
    const lease = leaseSnap.data() as LeaseDoc | undefined;
    if (lease) onTime = new Date(now).getDate() <= lease.dueDay;
  }

  const payment: PaymentDoc = {
    id: "",
    leaseId,
    tenantId,
    amount,
    method: "voucher",
    status: "completed",
    paidDate: now,
    onTime,
    voucherId,
  };
  await db.collection("payments").add(payment);
}
