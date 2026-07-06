import { db } from "../lib/firebaseAdmin";
import type { LeaseDoc, PaymentDoc, RentInvoiceDoc } from "../types";

interface RecordPaymentParams {
  tenantId: string;
  pmId?: string;
  amount: number;
  voucherId: string;
  leaseId?: string;
  leaseTermsId?: string;
  invoiceId?: string;
}

/** Writes a `payments` doc once money has actually moved (not before). */
export async function recordCompletedPayment(params: RecordPaymentParams): Promise<void> {
  const { tenantId, pmId, amount, voucherId, leaseId, leaseTermsId, invoiceId } = params;
  const now = Date.now();
  const dayOfMonth = new Date(now).getDate();

  let onTime: boolean | undefined;
  let invoiceRef: FirebaseFirestore.DocumentReference | undefined;

  if (invoiceId) {
    invoiceRef = db.collection("rentInvoices").doc(invoiceId);
    const invoiceSnap = await invoiceRef.get();
    const invoice = invoiceSnap.data() as RentInvoiceDoc | undefined;
    if (invoice) onTime = now <= invoice.dueDate;
  } else if (leaseId) {
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

  const paymentRef = db.collection("payments").doc();
  const payment: PaymentDoc = {
    id: paymentRef.id,
    tenantId,
    amount,
    method: "voucher",
    status: "completed",
    paidDate: now,
    voucherId,
    ...(leaseId ? { leaseId } : {}),
    ...(leaseTermsId ? { leaseTermsId } : {}),
    ...(invoiceId ? { invoiceId } : {}),
    ...(pmId ? { pmId } : {}),
    ...(onTime !== undefined ? { onTime } : {}),
  };
  await paymentRef.set(payment);

  if (invoiceRef) {
    await invoiceRef.update({
      status: "paid",
      paidAt: now,
      paymentId: paymentRef.id,
    });
  }
}
