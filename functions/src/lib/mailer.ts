import { createTransport } from "nodemailer";
import { logger } from "firebase-functions";

export const SMTP_SECRETS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
] as const;

export const APP_BASE_URL = process.env.APP_BASE_URL ?? "https://resigrid.co";

// ─── Core sender ──────────────────────────────────────────────────────────────

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string,
): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? "ResiGrid <team@resigrid.co>";

  if (!host || !user || !pass) {
    logger.warn("SMTP not configured — email not sent", { to, subject });
    return;
  }

  const transport = createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transport.sendMail({ from, to, subject, html, ...(text ? { text } : {}) });
  logger.info("Email sent", { to, subject });
}

// ─── Layout primitives ────────────────────────────────────────────────────────

function layout(preheader: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <span style="display:none;max-height:0;overflow:hidden">${preheader}</span>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f4f6;padding:32px 16px">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <tr><td style="background:#0b1f3a;padding:24px 32px;text-align:center">
        <a href="${APP_BASE_URL}" style="text-decoration:none">
          <span style="color:#f97316;font-size:22px;font-weight:700;letter-spacing:-0.5px">ResiGrid</span>
        </a>
        <p style="color:rgba(255,255,255,0.45);font-size:11px;margin:5px 0 0;letter-spacing:0.5px;text-transform:uppercase">Property Management, Simplified</p>
      </td></tr>
      <tr><td style="padding:36px 32px 28px">${bodyHtml}</td></tr>
      <tr><td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6">
        <p style="color:#9ca3af;font-size:11px;margin:0;line-height:1.7">
          &copy; ${new Date().getFullYear()} ResiGrid &bull; Property Management, Simplified<br>
          <a href="${APP_BASE_URL}" style="color:#9ca3af;text-decoration:underline">resigrid.co</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function h(text: string) {
  return `<p style="color:#0b1f3a;font-size:24px;font-weight:700;margin:0 0 8px;line-height:1.25">${text}</p>`;
}
function sub(text: string) {
  return `<p style="color:#6b7280;font-size:14px;margin:0 0 20px;line-height:1.65">${text}</p>`;
}
function p(text: string) {
  return `<p style="color:#374151;font-size:14px;margin:0 0 14px;line-height:1.7">${text}</p>`;
}
function cta(label: string, href: string) {
  return `<div style="text-align:center;margin:24px 0">
    <a href="${href}" style="background:#f97316;color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">${label} &rarr;</a>
  </div>`;
}
function table(...rows: string[]) {
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;background:#f9fafb;border-radius:10px;margin:16px 0">${rows.join("")}</table>`;
}
function row(label: string, value: string) {
  return `<tr>
    <td style="padding:9px 14px;color:#6b7280;font-size:13px;white-space:nowrap;border-bottom:1px solid #f3f4f6">${label}</td>
    <td style="padding:9px 14px;color:#0b1f3a;font-size:13px;font-weight:600;border-bottom:1px solid #f3f4f6">${value}</td>
  </tr>`;
}
function steps(items: [string, string, string][]) {
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;margin:16px 0 24px">
    ${items.map(([num, title, desc]) => `<tr>
      <td style="vertical-align:top;padding:6px 12px 6px 0;width:28px">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#f97316;color:#fff;font-weight:700;font-size:12px">${num}</span>
      </td>
      <td style="padding:6px 0 6px">
        <p style="margin:0;font-size:14px;font-weight:600;color:#0b1f3a">${title}</p>
        <p style="margin:0;font-size:13px;color:#6b7280">${desc}</p>
      </td>
    </tr>`).join("")}
  </table>`;
}
function note(text: string) {
  return `<p style="color:#9ca3af;font-size:12px;margin:12px 0 0;line-height:1.6">${text}</p>`;
}

// ─── Templates ────────────────────────────────────────────────────────────────

type EmailTemplate = { subject: string; html: string; text: string };

export const templates = {

  // ── Signup / onboarding ────────────────────────────────────────────────────

  welcomePM(opts: { name: string }): EmailTemplate {
    const first = opts.name.split(" ")[0];
    return {
      subject: "Welcome to ResiGrid — let's set up your first property",
      html: layout(
        "Your property management portal is ready.",
        h(`Welcome, ${first}!`) +
        sub("Your ResiGrid account is active. Here's how to get started in the next few minutes:") +
        steps([
          ["1", "Add a property", "Head to Properties → Add Property — takes under 60 seconds"],
          ["2", "Set up units", "Add units, photos, and rent amounts"],
          ["3", "Publish a listing", "Go live instantly — tenants can discover and apply"],
          ["4", "Send a lease", "Generate a digital lease and get it counter-signed in-app"],
        ]) +
        cta("Go to my portal", `${APP_BASE_URL}/pm/dashboard`) +
        note("You only pay once a unit is occupied — your first 3 days are free."),
      ),
      text: `Welcome to ResiGrid, ${opts.name}!\n\nYour portal is ready.\n\nNext steps:\n1. Add a property\n2. Set up units\n3. Publish a listing\n4. Send a lease\n\nGet started: ${APP_BASE_URL}/pm/dashboard\n\nResiGrid — resigrid.co`,
    };
  },

  welcomeTenant(opts: { name: string }): EmailTemplate {
    const first = opts.name.split(" ")[0];
    return {
      subject: "Welcome to ResiGrid",
      html: layout(
        "Your tenant account is ready.",
        h(`Welcome, ${first}!`) +
        sub("Your ResiGrid account is all set. Use it to pay rent, sign leases, submit maintenance requests, and message your property manager — all in one place.") +
        cta("Go to my portal", `${APP_BASE_URL}/tenant/dashboard`) +
        note("ResiGrid is always free for tenants."),
      ),
      text: `Welcome to ResiGrid, ${opts.name}!\n\nYour account is ready: ${APP_BASE_URL}/tenant/dashboard\n\nResiGrid is always free for tenants.\n\nResiGrid — resigrid.co`,
    };
  },

  // ── Applications ──────────────────────────────────────────────────────────

  applicationReceived(opts: { tenantName: string; listingAddress: string }): EmailTemplate {
    return {
      subject: `New application — ${opts.listingAddress}`,
      html: layout(
        `${opts.tenantName} applied for ${opts.listingAddress}`,
        h("New application received") +
        sub(`<strong style="color:#0b1f3a">${opts.tenantName}</strong> submitted an application for <strong style="color:#0b1f3a">${opts.listingAddress}</strong>.`) +
        cta("Review application", `${APP_BASE_URL}/pm/applications`),
      ),
      text: `New application from ${opts.tenantName} for ${opts.listingAddress}.\n\nReview: ${APP_BASE_URL}/pm/applications\n\nResiGrid — resigrid.co`,
    };
  },

  applicationShortlisted(opts: { listingAddress: string }): EmailTemplate {
    return {
      subject: `You've been shortlisted — ${opts.listingAddress}`,
      html: layout(
        "Good news — you made the shortlist.",
        h("You've been shortlisted!") +
        sub(`The property manager for <strong style="color:#0b1f3a">${opts.listingAddress}</strong> has moved you to their shortlist. They'll be in touch soon.`) +
        cta("View application", `${APP_BASE_URL}/tenant/applications`),
      ),
      text: `You've been shortlisted for ${opts.listingAddress}!\n\nView: ${APP_BASE_URL}/tenant/applications\n\nResiGrid — resigrid.co`,
    };
  },

  applicationApproved(opts: { listingAddress: string }): EmailTemplate {
    return {
      subject: `Application approved — ${opts.listingAddress}`,
      html: layout(
        "Congratulations — your application was approved.",
        h("Congratulations — you're approved!") +
        sub(`Your application for <strong style="color:#0b1f3a">${opts.listingAddress}</strong> has been approved. Your property manager will send your lease shortly.`) +
        cta("View application", `${APP_BASE_URL}/tenant/applications`),
      ),
      text: `Your application for ${opts.listingAddress} was approved!\n\nView: ${APP_BASE_URL}/tenant/applications\n\nResiGrid — resigrid.co`,
    };
  },

  applicationDenied(opts: { listingAddress: string; decisionNote?: string }): EmailTemplate {
    return {
      subject: `Application update — ${opts.listingAddress}`,
      html: layout(
        "An update on your application.",
        h("Application update") +
        sub(`We're sorry — your application for <strong style="color:#0b1f3a">${opts.listingAddress}</strong> was not accepted at this time.`) +
        (opts.decisionNote ? p(`<em>"${opts.decisionNote}"</em>`) : "") +
        cta("Browse listings", `${APP_BASE_URL}/listings`),
      ),
      text: `Update on your application for ${opts.listingAddress}:\n\nYour application was not accepted at this time.${opts.decisionNote ? `\n\n"${opts.decisionNote}"` : ""}\n\nBrowse listings: ${APP_BASE_URL}/listings\n\nResiGrid — resigrid.co`,
    };
  },

  applicationMoreInfo(opts: { listingAddress: string; decisionNote?: string }): EmailTemplate {
    return {
      subject: `More information needed — ${opts.listingAddress}`,
      html: layout(
        "Your property manager needs more information.",
        h("Additional information needed") +
        sub(`The property manager for <strong style="color:#0b1f3a">${opts.listingAddress}</strong> needs some additional information to continue reviewing your application.`) +
        (opts.decisionNote ? p(`<em>"${opts.decisionNote}"</em>`) : "") +
        cta("View application", `${APP_BASE_URL}/tenant/applications`),
      ),
      text: `More info needed for your application at ${opts.listingAddress}.${opts.decisionNote ? `\n\n"${opts.decisionNote}"` : ""}\n\nView: ${APP_BASE_URL}/tenant/applications\n\nResiGrid — resigrid.co`,
    };
  },

  // ── Notices ───────────────────────────────────────────────────────────────

  noticeToTenant(opts: { title: string; content: string; propertyName: string }): EmailTemplate {
    return {
      subject: `Notice: ${opts.title}`,
      html: layout(
        `Notice from ${opts.propertyName}: ${opts.title}`,
        `<p style="color:#6b7280;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.5px">Notice from ${opts.propertyName}</p>` +
        h(opts.title) +
        p(opts.content) +
        cta("View all notices", `${APP_BASE_URL}/tenant/notices`),
      ),
      text: `Notice from ${opts.propertyName}: ${opts.title}\n\n${opts.content}\n\nView all notices: ${APP_BASE_URL}/tenant/notices\n\nResiGrid — resigrid.co`,
    };
  },

  // ── Leases ────────────────────────────────────────────────────────────────

  leaseSent(opts: {
    tenantName: string;
    propertyAddress: string;
    rent: number;
    startDate: string;
    endDate?: string;
  }): EmailTemplate {
    return {
      subject: `Your lease is ready to sign — ${opts.propertyAddress}`,
      html: layout(
        "Your lease agreement is ready for review and signature.",
        h("Your lease is ready") +
        sub(`Your property manager has sent a lease for <strong style="color:#0b1f3a">${opts.propertyAddress}</strong>. Please review and sign at your earliest convenience.`) +
        table(
          row("Address", opts.propertyAddress),
          row("Monthly rent", `$${opts.rent.toLocaleString()}`),
          row("Start date", opts.startDate),
          ...(opts.endDate ? [row("End date", opts.endDate)] : []),
        ) +
        cta("Review &amp; sign lease", `${APP_BASE_URL}/tenant/lease`) +
        note("Please review all terms carefully before signing."),
      ),
      text: `Your lease is ready to sign!\n\nAddress: ${opts.propertyAddress}\nRent: $${opts.rent}/mo\nStart: ${opts.startDate}\n\nSign here: ${APP_BASE_URL}/tenant/lease\n\nResiGrid — resigrid.co`,
    };
  },

  leaseSignedByTenant(opts: { tenantName: string; propertyAddress: string }): EmailTemplate {
    return {
      subject: `Lease signed — ${opts.tenantName} signed for ${opts.propertyAddress}`,
      html: layout(
        `${opts.tenantName} has signed their lease.`,
        h("Tenant has signed the lease") +
        sub(`<strong style="color:#0b1f3a">${opts.tenantName}</strong> has signed the lease for <strong style="color:#0b1f3a">${opts.propertyAddress}</strong>. Counter-sign to make it fully executed.`) +
        cta("Counter-sign lease", `${APP_BASE_URL}/pm/leases`),
      ),
      text: `${opts.tenantName} has signed the lease for ${opts.propertyAddress}.\n\nCounter-sign: ${APP_BASE_URL}/pm/leases\n\nResiGrid — resigrid.co`,
    };
  },

  leaseFullySigned(opts: { propertyAddress: string; startDate: string }): EmailTemplate {
    return {
      subject: `Lease fully executed — ${opts.propertyAddress}`,
      html: layout(
        "Your lease is fully signed. Welcome home!",
        h("Welcome home!") +
        sub(`Your lease for <strong style="color:#0b1f3a">${opts.propertyAddress}</strong> is fully signed by both parties. Your tenancy begins on <strong style="color:#0b1f3a">${opts.startDate}</strong>.`) +
        cta("View my lease", `${APP_BASE_URL}/tenant/lease`),
      ),
      text: `Your lease for ${opts.propertyAddress} is fully executed!\n\nTenancy begins: ${opts.startDate}\n\nView lease: ${APP_BASE_URL}/tenant/lease\n\nResiGrid — resigrid.co`,
    };
  },

  // ── Maintenance ───────────────────────────────────────────────────────────

  maintenanceRequest(opts: {
    tenantName: string;
    category: string;
    item: string;
    description: string;
    priority: string;
    unitInfo: string;
  }): EmailTemplate {
    const priorityColor: Record<string, string> = {
      urgent: "#dc2626",
      high: "#ea580c",
      medium: "#d97706",
      low: "#6b7280",
    };
    const color = priorityColor[opts.priority] ?? "#6b7280";
    return {
      subject: `Maintenance request — ${opts.category}: ${opts.item} (${opts.priority})`,
      html: layout(
        `New ${opts.priority} priority maintenance request from ${opts.tenantName}`,
        h("New maintenance request") +
        sub(`<strong style="color:#0b1f3a">${opts.tenantName}</strong> submitted a maintenance request.`) +
        table(
          row("Unit", opts.unitInfo),
          row("Category", opts.category),
          row("Item", opts.item),
          row("Priority", `<span style="color:${color};font-weight:700">${opts.priority.charAt(0).toUpperCase() + opts.priority.slice(1)}</span>`),
          row("Description", opts.description.length > 150 ? opts.description.slice(0, 150) + "…" : opts.description),
        ) +
        cta("View request", `${APP_BASE_URL}/pm/maintenance`),
      ),
      text: `New maintenance request from ${opts.tenantName}\n\nUnit: ${opts.unitInfo}\nCategory: ${opts.category} — ${opts.item}\nPriority: ${opts.priority}\n\n${opts.description}\n\nView: ${APP_BASE_URL}/pm/maintenance\n\nResiGrid — resigrid.co`,
    };
  },

  // ── Voucher / payment invite ──────────────────────────────────────────────

  voucherInvite(opts: {
    senderName: string;
    amountUsd: number;
    claimUrl: string;
  }): EmailTemplate {
    const amount = `$${opts.amountUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    const features = [
      "Claim this payment directly to your bank account",
      "Free property management portal — no monthly fees",
      "Tenant applications & screening tools",
      "Lease creation & digital signing",
      "Maintenance request inbox",
    ];
    return {
      subject: `${opts.senderName} sent you ${amount} via ResiGrid`,
      html: layout(
        `${opts.senderName} sent you ${amount}`,
        `<div style="text-align:center;margin-bottom:28px">
          <p style="color:#6b7280;font-size:14px;margin:0 0 6px">${opts.senderName} sent you</p>
          <p style="color:#0b1f3a;font-size:52px;font-weight:700;margin:0;letter-spacing:-2px;line-height:1">${amount}</p>
        </div>` +
        cta("Claim Your Payment", opts.claimUrl) +
        note("This link expires in 14 days.") +
        `<div style="height:1px;background:#f3f4f6;margin:24px 0"></div>` +
        `<p style="color:#0b1f3a;font-size:16px;font-weight:700;margin:0 0 8px">You've been invited to join ResiGrid</p>` +
        p("Your tenant paid through ResiGrid — a free property management platform. Since you received a payment through us, you get <strong style=\"color:#0b1f3a\">free access to the full platform</strong>.") +
        `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:18px 20px;margin:16px 0">
          <p style="color:#9a3412;font-size:12px;font-weight:700;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.5px">Your free invitation includes:</p>
          ${features.map((f) => `<p style="margin:0 0 6px;font-size:13px;color:#4b5563"><span style="color:#f97316;font-weight:700;margin-right:8px">&#10003;</span>${f}</p>`).join("")}
        </div>`,
      ),
      text: `${opts.senderName} sent you ${amount} via ResiGrid.\n\nClaim your payment: ${opts.claimUrl}\n\nThis link expires in 14 days.\n\nResiGrid is a free property management platform. Click the link above to create a free account and claim this payment.\n\nResiGrid — resigrid.co`,
    };
  },
};

// ─── Legacy helper (voucher recipient) ───────────────────────────────────────

function isEmailAddress(contact: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
}

export async function notifyVoucherRecipient(opts: {
  recipientContact: string;
  senderName: string;
  amountUsd: number;
  claimToken: string;
}): Promise<void> {
  const { recipientContact, senderName, amountUsd, claimToken } = opts;
  const claimUrl = `${APP_BASE_URL}/claim?token=${claimToken}`;

  if (!isEmailAddress(recipientContact)) {
    logger.info("Voucher notify: recipient is a phone number — SMS not configured", {
      masked: recipientContact.replace(/\d(?=\d{4})/g, "*"),
    });
    return;
  }

  const tmpl = templates.voucherInvite({ senderName, amountUsd, claimUrl });
  await sendEmail(recipientContact, tmpl.subject, tmpl.html, tmpl.text);
}
