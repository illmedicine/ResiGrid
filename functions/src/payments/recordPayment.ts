import { logger } from "firebase-functions";
import { db } from "../lib/firebaseAdmin";
import type { LeaseDoc, PaymentDoc, RentInvoiceDoc, UserDoc } from "../types";

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

  // Auto-file a receipt into the tenant's documents. The receipt shows the
  // PM's business name (propertyManagers/{pmId}.businessName, falling back
  // to their display name) and links to the printable /receipt page. Adding
  // it to sharedDocuments also bumps the tenant's docs-on-file count, which
  // feeds their RGE engagement bonus via recalcScoreOnSharedDocumentChanged.
  // Non-fatal: a receipt failure must never fail the payment itself.
  if (pmId) {
    try {
      const [pmProfileSnap, pmUserSnap] = await Promise.all([
        db.collection("propertyManagers").doc(pmId).get(),
        db.collection("users").doc(pmId).get(),
      ]);
      const businessName =
        (pmProfileSnap.data() as { businessName?: string } | undefined)?.businessName?.trim() ||
        (pmUserSnap.data() as UserDoc | undefined)?.displayName ||
        "Your property manager";
      const dateStr = new Date(now).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      });

      const receiptRef = db.collection("sharedDocuments").doc();
      await receiptRef.set({
        id: receiptRef.id,
        uploaderId: pmId,
        uploaderRole: "property_manager",
        tenantId,
        pmId,
        name: `Rent Receipt — $${amount.toLocaleString("en-US")} — ${dateStr} — ${businessName}`,
        url: `https://resigrid.co/receipt/?id=${paymentRef.id}`,
        mimeType: "text/html",
        sizeBytes: 0,
        category: "other",
        createdAt: now,
      });
    } catch (err) {
      logger.error("recordCompletedPayment: receipt creation failed", err);
    }
  }
}
