import { Resend } from "resend";
import { ROLE_LABELS } from "@/lib/permissions";

const FROM = process.env.EMAIL_FROM ?? "HSE Dashboard <onboarding@resend.dev>";

export type InvitationEmailOptions = {
  to: string;
  name: string;
  inviteUrl: string;
  tenantName: string;
  role: string;
  jobTitle: string;
};

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInvitationEmail(opts: InvitationEmailOptions) {
  const roleLabel = esc(ROLE_LABELS[opts.role as keyof typeof ROLE_LABELS] ?? opts.role);
  const name = esc(opts.name);
  const tenantName = esc(opts.tenantName);
  const jobTitle = esc(opts.jobTitle);
  const inviteUrl = esc(opts.inviteUrl);
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:20px 28px;background:#0f766e;">
                <span style="color:#ffffff;font-size:16px;font-weight:700;">HSE Dashboard</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0f172a;">You're invited to join ${tenantName}</p>
                <p style="margin:0 0 20px;font-size:14px;color:#475569;">Hi ${name},</p>
                <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">
                  You have been invited to the HSE workspace <strong>${tenantName}</strong> as
                  <strong>${roleLabel}</strong> (${jobTitle}). Create your account to get started.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding:8px 0 20px;">
                      <a href="${inviteUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">Accept invitation</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:13px;color:#64748b;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="margin:0 0 16px;word-break:break-all;"><a href="${inviteUrl}" style="font-size:12px;color:#0f766e;">${inviteUrl}</a></p>
                <p style="margin:0;font-size:12px;color:#94a3b8;">The invitation link expires in 7 days. If you did not expect this email, you can safely ignore it.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendInvitationEmail(
  opts: InvitationEmailOptions
): Promise<{ ok: boolean; detail?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, detail: "RESEND_API_KEY is not configured." };
  }
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `You're invited to join ${opts.tenantName} on HSE Dashboard`,
      html: renderInvitationEmail(opts),
    });
    if (error) {
      return { ok: false, detail: error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "Email could not be sent." };
  }
}

export type ReportEmailOptions = {
  to: string;
  recipientName?: string | null;
  reportTitle: string;
  tenantName: string;
  periodLabel?: string;
  html: string;
};

function renderReportEmail(opts: ReportEmailOptions) {
  const reportTitle = esc(opts.reportTitle);
  const tenantName = esc(opts.tenantName);
  const period = opts.periodLabel ? esc(opts.periodLabel) : "";
  const recipient = esc(opts.recipientName || opts.to);
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:20px 28px;background:#0f766e;">
                <span style="color:#ffffff;font-size:16px;font-weight:700;">HSE Dashboard</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0f172a;">${reportTitle}</p>
                ${period ? `<p style="margin:0 0 20px;font-size:13px;color:#64748b;">${tenantName} &middot; ${period}</p>` : `<p style="margin:0 0 20px;font-size:13px;color:#64748b;">${tenantName}</p>`}
                <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">
                  Hi ${recipient}, the HSE report <strong>${reportTitle}</strong> is attached to this email.
                </p>
                <p style="margin:0;font-size:12px;color:#94a3b8;">Open the attached .html file in any browser to view, print, or save the report.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendReportEmail(
  opts: ReportEmailOptions
): Promise<{ ok: boolean; detail?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, detail: "RESEND_API_KEY is not configured." };
  }
  try {
    const resend = new Resend(apiKey);
    const fileName = opts.reportTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".html";
    const { error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `HSE Report: ${opts.reportTitle}`,
      html: renderReportEmail(opts),
      attachments: [
        {
          filename: fileName,
          content: Buffer.from(opts.html, "utf-8"),
        },
      ],
    });
    if (error) {
      return { ok: false, detail: error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "Email could not be sent." };
  }
}

export type NotificationEmailOptions = {
  to: string;
  recipientName?: string | null;
  tenantName: string;
  subject: string;
  heading: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
};

function renderNotificationEmail(opts: NotificationEmailOptions) {
  const tenantName = esc(opts.tenantName);
  const heading = esc(opts.heading);
  const body = esc(opts.body).replace(/\n/g, "<br/>");
  const cta = opts.ctaText && opts.ctaUrl ? esc(opts.ctaUrl) : "";
  const ctaLabel = opts.ctaText ? esc(opts.ctaText) : "";
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:20px 28px;background:#0f766e;">
                <span style="color:#ffffff;font-size:16px;font-weight:700;">HSE Dashboard</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0f172a;">${heading}</p>
                <p style="margin:0 0 16px;font-size:13px;color:#64748b;">${tenantName}</p>
                <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">${body}</p>
                ${cta ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 20px;"><a href="${cta}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">${ctaLabel}</a></td></tr></table>` : ""}
                <p style="margin:0;font-size:12px;color:#94a3b8;">This is an automated notification from the HSE Dashboard.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendNotificationEmail(
  opts: NotificationEmailOptions
): Promise<{ ok: boolean; detail?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, detail: "RESEND_API_KEY is not configured." };
  }
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: renderNotificationEmail(opts),
    });
    if (error) {
      return { ok: false, detail: error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "Email could not be sent." };
  }
}