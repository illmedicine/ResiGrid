import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { createTransport } from "nodemailer";
import { logger } from "firebase-functions";

const APP_BASE_URL = process.env.APP_BASE_URL ?? "https://resigrid.co";
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_ADDRESS = process.env.SMTP_FROM ?? "ResiGrid Team <team@resigrid.co>";

function buildTeamInviteHtml(adminName: string, inviteUrl: string, propertyCount: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0"
      style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <tr><td style="background:#0b1f3a;padding:28px 32px;text-align:center">
        <span style="color:#f97316;font-size:24px;font-weight:700">ResiGrid</span>
        <p style="color:rgba(255,255,255,0.55);font-size:12px;margin:6px 0 0;letter-spacing:0.5px;text-transform:uppercase">Property Management, Simplified</p>
      </td></tr>
      <tr><td style="padding:36px 32px 24px;text-align:center">
        <p style="color:#6b7280;font-size:14px;margin:0 0 8px">${adminName} invited you to join their team</p>
        <p style="color:#0b1f3a;font-size:28px;font-weight:700;margin:0 0 6px;line-height:1.2">You have a new team invite</p>
        <p style="color:#6b7280;font-size:14px;margin:0 0 28px">
          You'll have access to <strong style="color:#0b1f3a">${propertyCount} propert${propertyCount === 1 ? "y" : "ies"}</strong>
          and all their features — listings, leases, maintenance, and more.
        </p>
        <a href="${inviteUrl}"
           style="background:#f97316;color:#fff;padding:15px 40px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block">
          Accept Invite &rarr;
        </a>
        <p style="color:#9ca3af;font-size:12px;margin:14px 0 0">Sign in with the Google account that matches this email address.</p>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6">
        <p style="color:#9ca3af;font-size:11px;margin:0;line-height:1.7">
          You received this because ${adminName} added your email to their ResiGrid team.<br>
          If this was unexpected, you can safely ignore this email.<br>
          <a href="https://resigrid.co" style="color:#9ca3af;text-decoration:underline">resigrid.co</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

export const onTeamInviteCreated = onDocumentCreated(
  { document: "pmTeamInvites/{inviteId}", region: "us-central1" },
  async (event) => {
    const invite = event.data?.data();
    if (!invite || invite.status !== "pending") return;

    const inviteUrl = `${APP_BASE_URL}/pm/team/accept?invite=${invite.id}`;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      logger.warn("Team invite email: SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS", {
        to: invite.email,
        inviteUrl,
      });
      return;
    }

    const transport = createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transport.sendMail({
      from: FROM_ADDRESS,
      to: invite.email,
      subject: `${invite.adminName} invited you to join their ResiGrid team`,
      html: buildTeamInviteHtml(invite.adminName, inviteUrl, invite.propertyIds.length),
      text: [
        `${invite.adminName} invited you to join their ResiGrid property management team.`,
        "",
        `You'll have access to ${invite.propertyIds.length} propert${invite.propertyIds.length === 1 ? "y" : "ies"}.`,
        "",
        `Accept invite: ${inviteUrl}`,
        "",
        "Sign in with the Google account that matches this email address.",
        "",
        "ResiGrid — resigrid.co",
      ].join("\n"),
    });

    logger.info("Team invite email sent", { to: invite.email, inviteId: invite.id });
  },
);
