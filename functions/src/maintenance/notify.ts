import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { db } from "../lib/firebaseAdmin";
import { sendEmail, templates, SMTP_SECRETS } from "../lib/mailer";
import type { MaintenanceRequestDoc, PropertyDoc, UnitDoc, UserDoc } from "../types";

export const notifyOnMaintenanceRequest = onDocumentCreated(
  { document: "maintenanceRequests/{requestId}", secrets: [...SMTP_SECRETS] },
  async (event) => {
    const req = event.data?.data() as MaintenanceRequestDoc | undefined;
    if (!req) return;

    const [propertySnap, unitSnap, pmSnap] = await Promise.all([
      db.collection("properties").doc(req.propertyId).get(),
      db.collection("units").doc(req.unitId).get(),
      db.collection("users").doc(
        (await db.collection("properties").doc(req.propertyId).get()).data()?.ownerId ?? "__",
      ).get(),
    ]);

    const property = propertySnap.data() as PropertyDoc | undefined;
    const unit = unitSnap.data() as UnitDoc | undefined;
    const pm = pmSnap.data() as UserDoc | undefined;

    if (!pm?.email) return;

    const unitInfo = [
      unit?.unitNumber ? `Unit ${unit.unitNumber}` : null,
      property?.name ?? property?.addressLine1,
    ].filter(Boolean).join(" · ");

    const tmpl = templates.maintenanceRequest({
      tenantName: (await db.collection("users").doc(req.tenantId).get()).data()?.displayName ?? "Your tenant",
      category: req.category,
      item: req.item,
      description: req.description,
      priority: req.priority,
      unitInfo,
    });

    await sendEmail(pm.email, tmpl.subject, tmpl.html, tmpl.text);
  },
);
