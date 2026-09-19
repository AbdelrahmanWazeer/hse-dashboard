import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { reports, tenants } from "@/lib/db/schema";
import { renderReportHtml } from "@/lib/report-html";
import { sendReportEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Invoked by an external scheduler (cron). Protects itself with a bearer
 * token derived from CRON_SECRET. Sends every monthly report that is due
 * (no email sent yet this calendar month) to its configured recipient.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: "CRON_SECRET is not configured." }, { status: 500 });
  }
  const auth = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (auth !== secret) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

  const due = db
    .select()
    .from(reports)
    .where(eq(reports.schedule, "monthly"))
    .all()
    .filter((r) => !r.lastSentAt || r.lastSentAt < monthStart)
    .filter((r) => typeof r.emailTo === "string" && r.emailTo.length > 0 && r.emailTo.includes("@"));

  const processed: { id: string; title: string; to: string; ok: boolean; detail?: string }[] = [];

  for (const report of due) {
    const to = report.emailTo as string;
    const tenant = db.select().from(tenants).where(eq(tenants.id, report.tenantId)).get();
    const periodLabel = report.startDate
      ? new Date(report.startDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : "";

    const result = await sendReportEmail({
      to,
      recipientName: tenant?.name,
      reportTitle: report.title,
      tenantName: tenant?.name ?? "HSE",
      periodLabel,
      html: renderReportHtml(report, tenant?.name ?? "HSE"),
    });

    if (result.ok) {
      db.update(reports)
        .set({ lastSentAt: Date.now(), updatedAt: Date.now() })
        .where(eq(reports.id, report.id))
        .run();
      logAudit({
        tenantId: report.tenantId,
        action: "report.scheduled_sent",
        entityType: "report",
        entityId: report.id,
        details: { to, schedule: "monthly" },
      });
      processed.push({ id: report.id, title: report.title, to, ok: true });
      logger.info("scheduled report sent", { reportId: report.id, to });
    } else {
      logAudit({
        tenantId: report.tenantId,
        action: "report.scheduled_failed",
        entityType: "report",
        entityId: report.id,
        details: { to, detail: result.detail ?? "Email error" },
      });
      processed.push({ id: report.id, title: report.title, to, ok: false, detail: result.detail });
      logger.error("scheduled report failed", { reportId: report.id, detail: result.detail });
    }
  }

  return Response.json({ ok: true, processed });
}