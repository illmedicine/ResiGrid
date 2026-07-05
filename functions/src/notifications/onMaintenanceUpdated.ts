import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { db } from "../lib/firebaseAdmin";
import { sendEmail, SMTP_SECRETS, APP_BASE_URL } from "../lib/mailer";
import type { MaintenanceRequestDoc, UserDoc } from "../types";

type MaintenanceStatus = MaintenanceRequestDoc["status"];

const STATUS_SUBJECT: Partial<Record<MaintenanceStatus, string>> = {
  acknowledged: "We received your maintenance request",
  in_progress: "Work has started on your maintenance request",
  resolved: "Your maintenance request has been resolved",
};

const STATUS_HEADING: Partial<Record<MaintenanceStatus, string>> = {
  acknowledged: "Your request has been received",
  in_progress: "Work is underway",
  resolved: "Your request is resolved",
};

const STATUS_BODY: Partial<Record<MaintenanceStatus, string>> = {
  acknowledged:
    "Your property manager has reviewed your maintenance request and will schedule work soon. You'll receive another update when work begins.",
  in_progress:
    "Your property manager has started working on your maintenance request. You'll hear from them once it's complete.",
  resolved:
    "Your maintenance request has been marked as resolved. If the issue persists, please submit a new request from your tenant portal.",
};

function buildHtml(
  category: string,
  item: string,
  status: MaintenanceStatus,
  pmNotes?: string,
): string {
  const heading = STATUS_HEADING[status] ?? "Maintenance update";
  const body = STATUS_BODY[status] ?? "Your maintenance request status has been updated.";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f4f6;padding:32px 16px">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <tr><td style="background:#0b1f3a;padding:24px 32px;text-align:center">
        <a href="${APP_BASE_URL}" style="text-decoration:none">
          <span style="color:#f97316;font-size:22px;font-weight:700;letter-spacing:-0.5px">ResiGrid</span>
        </a>
      </td></tr>
      <tr><td style="padding:36px 32px 28px">
        <p style="color:#0b1f3a;font-size:22px;font-weight:700;margin:0 0 8px">${heading}</p>
        <p style="color:#6b7280;font-size:14px;margin:0 0 20px;line-height:1.65">${body}</p>
        <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;background:#f9fafb;border-radius:10px;margin:0 0 20px">
          <tr>
            <td style="padding:9px 14px;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6">Category</td>
            <td style="padding:9px 14px;color:#0b1f3a;font-size:13px;font-weight:600;border-bottom:1px solid #f3f4f6">${category}: ${item}</td>
          </tr>
          <tr>
            <td style="padding:9px 14px;color:#6b7280;font-size:13px">Status</td>
            <td style="padding:9px 14px;color:#0b1f3a;font-size:13px;font-weight:600">${status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</td>
          </tr>
        </table>
        ${pmNotes ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px;margin-bottom:20px"><p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#9a3412;text-transform:uppercase;letter-spacing:0.5px">Note from your manager</p><p style="margin:0;font-size:14px;color:#374151;line-height:1.6">${pmNotes}</p></div>` : ""}
        <div style="text-align:center">
          <a href="${APP_BASE_URL}/tenant/maintenance" style="background:#f97316;color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">View request &rarr;</a>
        </div>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6">
        <p style="color:#9ca3af;font-size:11px;margin:0;line-height:1.7">
          &copy; ${new Date().getFullYear()} ResiGrid &bull; <a href="${APP_BASE_URL}" style="color:#9ca3af;text-decoration:underline">resigrid.co</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

export const onMaintenanceRequestUpdated = onDocumentUpdated(
  { document: "maintenanceRequests/{requestId}", secrets: [...SMTP_SECRETS] },
  async (event) => {
    const before = event.data?.before.data() as MaintenanceRequestDoc | undefined;
    const after = event.data?.after.data() as MaintenanceRequestDoc | undefined;
    if (!before || !after || before.status === after.status) return;

    const notifiableStatuses: MaintenanceStatus[] = ["acknowledged", "in_progress", "resolved"];
    if (!notifiableStatuses.includes(after.status)) return;

    const tenantSnap = await db.collection("users").doc(after.tenantId).get();
    const tenant = tenantSnap.data() as UserDoc | undefined;
    if (!tenant?.email) return;

    const subject = STATUS_SUBJECT[after.status] ?? "Maintenance request update";
    const html = buildHtml(after.category, after.item, after.status, after.pmNotes);
    const text = [
      `Maintenance update: ${after.category} — ${after.item}`,
      `Status: ${after.status.replace("_", " ")}`,
      "",
      STATUS_BODY[after.status] ?? "",
      ...(after.pmNotes ? [`\nNote from your manager: "${after.pmNotes}"`] : []),
      "",
      `View request: ${APP_BASE_URL}/tenant/maintenance`,
      "ResiGrid — resigrid.co",
    ].join("\n");

    await sendEmail(tenant.email, subject, html, text);
  },
);
