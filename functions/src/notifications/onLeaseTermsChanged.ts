import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { db } from "../lib/firebaseAdmin";
import { sendEmail, templates, SMTP_SECRETS } from "../lib/mailer";
import type { LeaseTermsDoc, PropertyDoc, UserDoc } from "../types";

async function getPropertyAddress(propertyId: string): Promise<string> {
  const snap = await db.collection("properties").doc(propertyId).get();
  const p = snap.data() as PropertyDoc | undefined;
  if (!p) return "your property";
  return [p.addressLine1, p.city, p.state].filter(Boolean).join(", ");
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

export const onLeaseTermsCreated = onDocumentCreated(
  { document: "leaseTerms/{leaseId}", secrets: [...SMTP_SECRETS] },
  async (event) => {
    const lease = event.data?.data() as LeaseTermsDoc | undefined;
    // Only email when the lease is sent (not on draft creation)
    if (!lease || lease.status !== "sent") return;
    if (!lease.tenantEmail) return;

    const propertyAddress = await getPropertyAddress(lease.propertyId);

    const tmpl = templates.leaseSent({
      tenantName: lease.tenantName,
      propertyAddress,
      rent: lease.rent,
      startDate: formatDate(lease.startDate),
      endDate: lease.endDate ? formatDate(lease.endDate) : undefined,
    });

    await sendEmail(lease.tenantEmail, tmpl.subject, tmpl.html, tmpl.text);
  },
);

export const onLeaseTermsUpdated = onDocumentUpdated(
  { document: "leaseTerms/{leaseId}", secrets: [...SMTP_SECRETS] },
  async (event) => {
    const before = event.data?.before.data() as LeaseTermsDoc | undefined;
    const after = event.data?.after.data() as LeaseTermsDoc | undefined;
    if (!before || !after || before.status === after.status) return;

    const propertyAddress = await getPropertyAddress(after.propertyId);

    if (after.status === "sent" && before.status === "draft") {
      // Draft → sent: email the tenant
      if (!after.tenantEmail) return;
      const tmpl = templates.leaseSent({
        tenantName: after.tenantName,
        propertyAddress,
        rent: after.rent,
        startDate: formatDate(after.startDate),
        endDate: after.endDate ? formatDate(after.endDate) : undefined,
      });
      await sendEmail(after.tenantEmail, tmpl.subject, tmpl.html, tmpl.text);

    } else if (after.status === "tenant_signed") {
      // Tenant signed: email the PM
      const pmSnap = await db.collection("users").doc(after.pmId).get();
      const pm = pmSnap.data() as UserDoc | undefined;
      if (!pm?.email) return;
      const tmpl = templates.leaseSignedByTenant({
        tenantName: after.tenantName,
        propertyAddress,
      });
      await sendEmail(pm.email, tmpl.subject, tmpl.html, tmpl.text);

    } else if (after.status === "fully_signed") {
      // Fully executed: email the tenant
      if (!after.tenantEmail) return;
      const tmpl = templates.leaseFullySigned({
        propertyAddress,
        startDate: formatDate(after.startDate),
      });
      await sendEmail(after.tenantEmail, tmpl.subject, tmpl.html, tmpl.text);
    }
  },
);
