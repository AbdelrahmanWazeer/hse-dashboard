"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { reports, tenants, id } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { getYTDStats, getIncidentBreakdown, getTrainingStats } from "@/lib/queries";
import { sendReportEmail } from "@/lib/email";
import { renderReportHtml } from "@/lib/report-html";
import { logAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getTime();
}

function endOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0, 23, 59, 59).getTime();
}

export async function generateMonthlyReport(formData: FormData) {
  const user = await requirePermission("reports:create");
  const tenant = await getCurrentTenant();

  const rawMonth = String(formData.get("month") ?? "");
  const [y, m] = rawMonth.includes("-") ? rawMonth.split("-").map(Number) : [new Date().getFullYear(), new Date().getMonth()];
  const year = y || new Date().getFullYear();
  const monthIdx = m != null && !Number.isNaN(m) ? m : new Date().getMonth();

  const stats = await getYTDStats(tenant.id, year);
  const breakdown = await getIncidentBreakdown(tenant.id, year);
  const training = await getTrainingStats(tenant.id);

  const title = `Monthly HSE Report — ${year}-${String(monthIdx + 1).padStart(2, "0")}`;

  const data = {
    year,
    month: monthIdx,
    generatedAt: Date.now(),
    generatedBy: user.name,
    stats: {
      totalManhours: stats.totalManhours,
      totalIncidents: stats.totalIncidents,
      ltiCount: stats.ltiCount,
      recordable: stats.recordable,
      ltir: stats.ltir,
      trir: stats.trir,
      firstAid: stats.firstAid,
      nearMiss: stats.nearMiss,
      openFindings: stats.openFindings,
      closedFindings: stats.closedFindings,
      totalTBT: stats.totalTBT,
      tbtSessions: stats.tbtSessions,
      totalInductions: stats.totalInductions,
      totalTrainings: stats.totalTrainings,
      activePermits: stats.activePermits,
    },
    breakdown,
    training,
  };

  const reportId = id("rpt");
  db
    .insert(reports)
    .values({
      id: reportId,
      tenantId: tenant.id,
      title,
      type: "monthly",
      description: `Monthly HSE performance report generated on ${new Date().toLocaleDateString()}.`,
      startDate: startOfMonth(year, monthIdx),
      endDate: endOfMonth(year, monthIdx),
      data,
      createdById: user.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    .run();

  logAudit({
    tenantId: tenant.id,
    actorId: user.id,
    actorName: user.name,
    action: "report.generate",
    entityType: "report",
    entityId: reportId,
    details: { title, year, month: monthIdx, type: "monthly" },
  });

  revalidatePath("/reports");
  redirect(`/reports/${reportId}`);
}

export async function toggleReportSchedule(formData: FormData) {
  const user = await requirePermission("reports:export");
  const reportId = String(formData.get("id") ?? "");
  const report = db.select().from(reports).where(eq(reports.id, reportId)).get();
  if (!report) redirect("/reports");

  const enabled = String(formData.get("enabled") ?? "") === "1";
  const emailTo = String(formData.get("emailTo") ?? "").trim().toLowerCase();

  if (enabled) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTo)) {
      redirect(`/reports/${reportId}?email=failed&emailDetail=${encodeURIComponent("Enter a valid recipient email to schedule monthly delivery.")}`);
    }
  }

  db.update(reports)
    .set({
      schedule: enabled ? "monthly" : null,
      emailTo: enabled ? emailTo : null,
      updatedAt: Date.now(),
    })
    .where(eq(reports.id, reportId))
    .run();

  logAudit({
    tenantId: report.tenantId,
    actorId: user.id,
    actorName: user.name,
    action: enabled ? "report.schedule_enabled" : "report.schedule_disabled",
    entityType: "report",
    entityId: reportId,
    details: { emailTo },
  });

  revalidatePath(`/reports/${reportId}`);
  redirect(`/reports/${reportId}?schedule=${enabled ? "on" : "off"}`);
}

export async function deleteReport(formData: FormData) {
  const user = await requirePermission("reports:delete");
  const tenant = await getCurrentTenant();
  const id = String(formData.get("id") ?? "");
  const existing = db.select().from(reports).where(eq(reports.id, id)).get();
  if (!existing || existing.tenantId !== tenant.id) return;
  if (existing.createdById && existing.createdById !== user.id && user.role !== "admin") return;
  db.delete(reports).where(eq(reports.id, id)).run();
  logAudit({
    tenantId: tenant.id,
    actorId: user.id,
    actorName: user.name,
    action: "report.delete",
    entityType: "report",
    entityId: id,
    details: { title: existing.title },
  });
  revalidatePath("/reports");
}

export async function emailReport(formData: FormData) {
  const user = await requirePermission("reports:export");
  const reportId = String(formData.get("id") ?? "");
  const to = String(formData.get("to") ?? "").trim().toLowerCase();

  const report = db.select().from(reports).where(eq(reports.id, reportId)).get();
  if (!report) redirect("/reports");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    redirect(`/reports/${reportId}?email=failed&emailDetail=${encodeURIComponent("Please enter a valid email address.")}`);
  }

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

  revalidatePath(`/reports/${reportId}`);
  if (!result.ok) {
    logAudit({
      tenantId: report.tenantId,
      actorId: user.id,
      actorName: user.name,
      action: "report.email_failed",
      entityType: "report",
      entityId: reportId,
      details: { to, detail: result.detail ?? "Unknown email error" },
    });
    logger.error("report email failed", { reportId, to, detail: result.detail });
    redirect(`/reports/${reportId}?email=failed&emailDetail=${encodeURIComponent(result.detail ?? "Email could not be sent.")}`);
  }
  logAudit({
    tenantId: report.tenantId,
    actorId: user.id,
    actorName: user.name,
    action: "report.email_sent",
    entityType: "report",
    entityId: reportId,
    details: { to },
  });
  redirect(`/reports/${reportId}?email=ok`);
}
