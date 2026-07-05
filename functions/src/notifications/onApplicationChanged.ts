import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { db } from "../lib/firebaseAdmin";
import { sendEmail, templates, SMTP_SECRETS } from "../lib/mailer";
import type { ApplicationDoc, ListingDoc, UserDoc } from "../types";

async function getListingAddress(listingId: string): Promise<string> {
  const snap = await db.collection("listings").doc(listingId).get();
  const l = snap.data() as ListingDoc | undefined;
  if (!l) return "your listing";
  return [l.addressLine1, l.city, l.state].filter(Boolean).join(", ");
}

export const onApplicationCreated = onDocumentCreated(
  { document: "applications/{appId}", secrets: [...SMTP_SECRETS] },
  async (event) => {
    const app = event.data?.data() as ApplicationDoc | undefined;
    if (!app || !app.pmId) return;

    const [tenantSnap, pmSnap] = await Promise.all([
      db.collection("users").doc(app.tenantId).get(),
      db.collection("users").doc(app.pmId).get(),
    ]);

    const pm = pmSnap.data() as UserDoc | undefined;
    if (!pm?.email) return;

    const tenantName = (tenantSnap.data() as UserDoc | undefined)?.displayName ?? "A tenant";
    const listingAddress = await getListingAddress(app.listingId);

    const tmpl = templates.applicationReceived({ tenantName, listingAddress });
    await sendEmail(pm.email, tmpl.subject, tmpl.html, tmpl.text);
  },
);

export const onApplicationUpdated = onDocumentUpdated(
  { document: "applications/{appId}", secrets: [...SMTP_SECRETS] },
  async (event) => {
    const before = event.data?.before.data() as ApplicationDoc | undefined;
    const after = event.data?.after.data() as ApplicationDoc | undefined;
    if (!before || !after || before.status === after.status) return;

    const tenantSnap = await db.collection("users").doc(after.tenantId).get();
    const tenant = tenantSnap.data() as UserDoc | undefined;
    if (!tenant?.email) return;

    const listingAddress = await getListingAddress(after.listingId);

    let tmpl: { subject: string; html: string; text: string } | null = null;

    if (after.status === "shortlisted") {
      tmpl = templates.applicationShortlisted({ listingAddress });
    } else if (after.status === "approved") {
      tmpl = templates.applicationApproved({ listingAddress });
    } else if (after.status === "denied") {
      tmpl = templates.applicationDenied({ listingAddress, decisionNote: after.decisionNote });
    } else if (after.status === "more_info_needed") {
      tmpl = templates.applicationMoreInfo({ listingAddress, decisionNote: after.decisionNote });
    }

    if (!tmpl) return;
    await sendEmail(tenant.email, tmpl.subject, tmpl.html, tmpl.text);
  },
);
