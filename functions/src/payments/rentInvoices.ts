import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { db } from "../lib/firebaseAdmin";
import type { LeaseTermsDoc, RentInvoiceDoc } from "../types";

// ── Automated rent invoices ───────────────────────────────────────────────────
// One invoice per rolling 30-day cycle, anchored to the lease's startDate
// (not calendar months). Cycle 1 is created as soon as the lease is fully
// signed; the daily scheduled function keeps creating each subsequent cycle's
// invoice and flips any invoice whose due date has passed to "overdue".

const MS_30_DAYS = 30 * 24 * 60 * 60 * 1000;

export function computeCycleDueDate(startDate: number, cycleNumber: number): number {
  return startDate + cycleNumber * MS_30_DAYS;
}

export function currentCycleNumber(startDate: number, now: number): number {
  return Math.max(1, Math.floor((now - startDate) / MS_30_DAYS) + 1);
}

export async function ensureInvoiceForCycle(
  lease: LeaseTermsDoc,
  cycleNumber: number,
): Promise<void> {
  const existing = await db
    .collection("rentInvoices")
    .where("leaseTermsId", "==", lease.id)
    .where("cycleNumber", "==", cycleNumber)
    .limit(1)
    .get();
  if (!existing.empty) return;
  if (!lease.tenantId) return;

  const ref = db.collection("rentInvoices").doc();
  const periodStart = lease.startDate + (cycleNumber - 1) * MS_30_DAYS;
  const invoice: RentInvoiceDoc = {
    id: ref.id,
    leaseTermsId: lease.id,
    tenantId: lease.tenantId,
    pmId: lease.pmId,
    propertyId: lease.propertyId,
    unitId: lease.unitId,
    amount: lease.rent,
    cycleNumber,
    periodStart,
    dueDate: computeCycleDueDate(lease.startDate, cycleNumber),
    status: "pending",
    createdAt: Date.now(),
  };
  await ref.set(invoice);
}

export const createFirstRentInvoice = onDocumentUpdated(
  "leaseTerms/{leaseId}",
  async (event) => {
    const before = event.data?.before?.data() as LeaseTermsDoc | undefined;
    const after = event.data?.after?.data() as LeaseTermsDoc | undefined;
    if (!after || after.status !== "fully_signed") return;
    if (before?.status === "fully_signed") return;

    await ensureInvoiceForCycle({ ...after, id: event.params.leaseId }, 1);
  },
);

export const generateRecurringRentInvoices = onSchedule(
  { schedule: "0 6 * * *", region: "us-central1", timeoutSeconds: 540 },
  async () => {
    const now = Date.now();
    const leaseSnap = await db
      .collection("leaseTerms")
      .where("status", "==", "fully_signed")
      .get();

    logger.info(`generateRecurringRentInvoices: ${leaseSnap.docs.length} fully-signed leases`);

    for (const leaseDoc of leaseSnap.docs) {
      const lease = { ...(leaseDoc.data() as LeaseTermsDoc), id: leaseDoc.id };
      try {
        const cycle = currentCycleNumber(lease.startDate, now);
        await ensureInvoiceForCycle(lease, cycle);
      } catch (err) {
        logger.error(`generateRecurringRentInvoices: failed for lease ${lease.id}`, err);
      }
    }

    const overdueSnap = await db
      .collection("rentInvoices")
      .where("status", "==", "pending")
      .get();
    for (const invoiceDoc of overdueSnap.docs) {
      const invoice = invoiceDoc.data() as RentInvoiceDoc;
      if (invoice.dueDate < now) {
        await invoiceDoc.ref.update({ status: "overdue" });
      }
    }

    logger.info("generateRecurringRentInvoices: complete");
  },
);
