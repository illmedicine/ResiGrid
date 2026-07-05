import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import { db } from "../lib/firebaseAdmin";
import { sendEmail, templates, SMTP_SECRETS } from "../lib/mailer";
import type { NoticeDoc, PropertyDoc, UnitDoc, UserDoc } from "../types";

async function getTenantEmails(notice: NoticeDoc): Promise<{ email: string; name: string }[]> {
  const results: { email: string; name: string }[] = [];

  if (notice.scope === "unit" && notice.scopeId) {
    // Single unit → one tenant
    const unitSnap = await db.collection("units").doc(notice.scopeId).get();
    const unit = unitSnap.data() as UnitDoc | undefined;
    if (!unit?.currentTenantId) return [];
    const userSnap = await db.collection("users").doc(unit.currentTenantId).get();
    const user = userSnap.data() as UserDoc | undefined;
    if (user?.email) results.push({ email: user.email, name: user.displayName });

  } else if (notice.scope === "property" && notice.scopeId) {
    // All occupied units in property
    const unitsSnap = await db
      .collection("units")
      .where("propertyId", "==", notice.scopeId)
      .where("currentTenantId", "!=", null)
      .get();
    const tenantIds = unitsSnap.docs
      .map((d) => (d.data() as UnitDoc).currentTenantId)
      .filter(Boolean) as string[];
    if (!tenantIds.length) return [];
    const userSnaps = await Promise.all(
      tenantIds.map((id) => db.collection("users").doc(id).get()),
    );
    for (const snap of userSnaps) {
      const u = snap.data() as UserDoc | undefined;
      if (u?.email) results.push({ email: u.email, name: u.displayName });
    }

  } else if (notice.scope === "all") {
    // All tenants who have a lease with this PM
    const leasesSnap = await db
      .collection("leases")
      .where("pmId", "==", notice.pmId)
      .get();
    const tenantIds = [...new Set(leasesSnap.docs.map((d) => d.data().tenantId as string))];
    if (!tenantIds.length) return [];
    const userSnaps = await Promise.all(
      tenantIds.map((id) => db.collection("users").doc(id).get()),
    );
    for (const snap of userSnaps) {
      const u = snap.data() as UserDoc | undefined;
      if (u?.email) results.push({ email: u.email, name: u.displayName });
    }
  }

  return results;
}

export const onNoticeCreated = onDocumentCreated(
  { document: "notices/{noticeId}", secrets: [...SMTP_SECRETS] },
  async (event) => {
    const notice = event.data?.data() as NoticeDoc | undefined;
    if (!notice) return;

    // Get property name for the email subject
    let propertyName = "Your property manager";
    if (notice.scopeId && (notice.scope === "property" || notice.scope === "unit")) {
      const propId =
        notice.scope === "property"
          ? notice.scopeId
          : (await db.collection("units").doc(notice.scopeId).get()).data()?.propertyId;
      if (propId) {
        const propSnap = await db.collection("properties").doc(propId).get();
        const prop = propSnap.data() as PropertyDoc | undefined;
        propertyName = prop?.name ?? prop?.addressLine1 ?? propertyName;
      }
    } else if (notice.scope === "all") {
      const pmSnap = await db.collection("users").doc(notice.pmId).get();
      const pm = pmSnap.data() as UserDoc | undefined;
      propertyName = pm?.displayName ?? propertyName;
    }

    const recipients = await getTenantEmails(notice);
    if (!recipients.length) {
      logger.info("Notice created — no tenant recipients found", { noticeId: event.params.noticeId });
      return;
    }

    const tmpl = templates.noticeToTenant({
      title: notice.title,
      content: notice.content,
      propertyName,
    });

    await Promise.all(
      recipients.map(({ email }) => sendEmail(email, tmpl.subject, tmpl.html, tmpl.text)),
    );

    logger.info("Notice emails sent", {
      noticeId: event.params.noticeId,
      recipientCount: recipients.length,
    });
  },
);
