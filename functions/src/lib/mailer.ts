import { createTransport } from "nodemailer";
import { logger } from "firebase-functions";

const CLAIM_BASE_URL = process.env.CLAIM_BASE_URL ?? "https://resigrid.co/claim";
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_ADDRESS = process.env.SMTP_FROM ?? "ResiGrid Payments <payments@resigrid.co>";

function isEmailAddress(contact: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
}

function buildInviteHtml(senderName: string, amountUsd: number, claimUrl: string): string {
  const amount = `$${amountUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  const features = [
    "Claim this payment directly to your bank account",
    "Full property management portal — no monthly fees",
    "Tenant applications & screening tools",
    "Lease creation & digital signing",
    "Maintenance request inbox",
    "Secure tenant messaging",
  ];
  const featureRows = features
    .map(
      (f) => `<tr><td style="padding:3px 0">
        <span style="color:#f97316;font-weight:700;margin-right:8px">&#10003;</span>
        <span style="color:#4b5563;font-size:13px">${f}</span>
      </td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f4f6;padding:32px 16px">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="max-width:580px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

      <tr><td style="background:#0b1f3a;padding:28px 32px;text-align:center">
        <span style="color:#f97316;font-size:24px;font-weight:700;letter-spacing:-0.5px">ResiGrid</span>
        <p style="color:rgba(255,255,255,0.55);font-size:12px;margin:6px 0 0;letter-spacing:0.5px;text-transform:uppercase">Property Management, Simplified</p>
      </td></tr>

      <tr><td style="padding:36px 32px 24px;text-align:center">
        <p style="color:#6b7280;font-size:14px;margin:0 0 6px">${senderName} sent you</p>
        <p style="color:#0b1f3a;font-size:52px;font-weight:700;margin:0 0 28px;letter-spacing:-2px;line-height:1">${amount}</p>
        <a href="${claimUrl}"
           style="background:#f97316;color:#ffffff;padding:15px 40px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;letter-spacing:0.1px">
          Claim Your Payment &rarr;
        </a>
        <p style="color:#9ca3af;font-size:12px;margin:14px 0 0">This link expires in 14 days</p>
      </td></tr>

      <tr><td style="padding:0 32px"><div style="height:1px;background:#f3f4f6"></div></td></tr>

      <tr><td style="padding:28px 32px 24px">
        <h2 style="color:#0b1f3a;font-size:17px;font-weight:700;margin:0 0 10px">You&rsquo;ve been invited to join ResiGrid</h2>
        <p style="color:#6b7280;font-size:14px;line-height:1.65;margin:0 0 20px">
          Your tenant paid through ResiGrid &mdash; a free property management platform that makes
          collecting rent and running your rental business effortless. Since you received a payment
          through us, you get <strong style="color:#0b1f3a">free access to the full platform</strong>.
          No signup fees, no monthly charges.
        </p>
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px 24px">
          <p style="color:#9a3412;font-size:13px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px">Your free invitation includes:</p>
          <table cellpadding="0" cellspacing="0" role="presentation">${featureRows}</table>
        </div>
      </td></tr>

      <tr><td style="padding:0 32px 36px;text-align:center">
        <a href="${claimUrl}"
           style="background:#0b1f3a;color:#ffffff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">
          Get Started &mdash; Claim ${amount}
        </a>
      </td></tr>

      <tr><td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6">
        <p style="color:#9ca3af;font-size:11px;margin:0;line-height:1.7">
          You received this because your contact info was provided as a payment recipient.<br>
          If you didn&rsquo;t expect this, you can safely ignore it &mdash; no action required.<br>
          <a href="https://resigrid.co" style="color:#9ca3af;text-decoration:underline">resigrid.co</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/** Sends a payment-received invite email to a non-ResiGrid landlord.
 * Gracefully no-ops if SMTP env vars are absent (logs a warning instead). */
export async function notifyVoucherRecipient(opts: {
  recipientContact: string;
  senderName: string;
  amountUsd: number;
  claimToken: string;
}): Promise<void> {
  const { recipientContact, senderName, amountUsd, claimToken } = opts;
  const claimUrl = `${CLAIM_BASE_URL}?token=${claimToken}`;

  if (!isEmailAddress(recipientContact)) {
    // Phone number — SMS requires Twilio/similar. Log so the integration
    // point is visible once a provider is added.
    logger.info("Voucher notify: recipient is a phone number — SMS not configured", {
      masked: recipientContact.replace(/\d(?=\d{4})/g, "*"),
    });
    return;
  }

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    logger.warn(
      "Voucher notify: SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS " +
        "in Firebase function environment to enable email invites",
      { to: recipientContact },
    );
    return;
  }

  const transport = createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const amount = `$${amountUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  await transport.sendMail({
    from: FROM_ADDRESS,
    to: recipientContact,
    subject: `${senderName} sent you ${amount} via ResiGrid`,
    html: buildInviteHtml(senderName, amountUsd, claimUrl),
    text: [
      `${senderName} sent you ${amount} via ResiGrid.`,
      "",
      `Claim your payment: ${claimUrl}`,
      "",
      "This link expires in 14 days.",
      "",
      "ResiGrid is a free property management platform. Click the link above to create",
      "a free account, claim this payment, and start managing your rental properties.",
      "No signup fees. No monthly charges.",
      "",
      "Questions? Visit https://resigrid.co",
    ].join("\n"),
  });

  logger.info("Voucher invite email sent", { to: recipientContact });
}
