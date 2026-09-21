import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { reports, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { formatDate, formatDateTime, monthLabel } from "@/lib/utils";
import { INCIDENT_TYPE_META } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, ArrowLeft, Mail, Presentation, FileText } from "lucide-react";
import Link from "next/link";
import { emailReport, toggleReportSchedule } from "../actions";
import { can } from "@/lib/permissions";
import { CalendarClock } from "lucide-react";

type ReportData = {
  year: number;
  month: number;
  generatedAt: number;
  generatedBy?: string | null;
  stats?: {
    totalManhours?: number;
    totalIncidents?: number;
    ltiCount?: number;
    recordable?: number;
    ltir?: number;
    trir?: number;
    firstAid?: number;
    nearMiss?: number;
    openFindings?: number;
    closedFindings?: number;
    totalTBT?: number;
    tbtSessions?: number;
    totalInductions?: number;
    totalTrainings?: number;
    activePermits?: number;
  };
  breakdown?: {
    byType?: Record<string, { count: number; lostDays: number; restrictedDays: number }>;
    totalLostDays?: number;
    totalRestrictedDays?: number;
    totalIncidents?: number;
  };
  training?: { total?: number; valid?: number; expiring?: number; expired?: number };
};

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ email?: string; emailDetail?: string; schedule?: string; to?: string }>;
}) {
  const user = await requireUser();
  const tenant = await getCurrentTenant();
  const t = await getT();
  const locale = await getLocale();
  const { id } = await params;
  const { email, emailDetail, schedule, to } = await searchParams;

  const report = db.select().from(reports).where(eq(reports.id, id)).get();
  if (!report || report.tenantId !== tenant.id) notFound();

  const creator = report.createdById ? db.select().from(users).where(eq(users.id, report.createdById)).get() : null;
  const data = (report.data ?? {}) as ReportData;
  const s = data.stats ?? {};

  const reportStart = report.startDate ? new Date(report.startDate) : null;
  const generated = new Date(data.generatedAt ?? report.createdAt);
  const periodLabel = reportStart ? `${monthLabel(reportStart.getMonth(), locale)} ${reportStart.getFullYear()}` : "";
  const monthText = periodLabel || `${monthLabel(generated.getMonth(), locale)} ${generated.getFullYear()}`;

  const statCards: { label: string; labelAr: string; value: string; tone?: string }[] = [
    { label: "Man-hours", labelAr: "ساعات العمل", value: (s.totalManhours ?? 0).toLocaleString() },
    { label: "Incidents", labelAr: "الحوادث", value: String(s.totalIncidents ?? 0), tone: s.totalIncidents ? "text-red-600" : "" },
    { label: "LTI", labelAr: "إصابات فقدان الوقت", value: String(s.ltiCount ?? 0), tone: s.ltiCount ? "text-red-600" : "" },
    { label: "Near-miss", labelAr: "حادثة وشيكة", value: String(s.nearMiss ?? 0) },
    { label: "Recordable", labelAr: "قابلة للتسجيل", value: String(s.recordable ?? 0) },
    { label: "LTI Rate", labelAr: "معدل إصابات فقدان الوقت", value: (s.ltir ?? 0).toFixed(2) },
    { label: "TRIR", labelAr: "معدل الحوادث القابلة للتسجيل", value: (s.trir ?? 0).toFixed(2) },
    { label: "Open findings", labelAr: "ملاحظات مفتوحة", value: String(s.openFindings ?? 0) },
    { label: "TBT attendees", labelAr: "حضور جلسات التوعية", value: (s.totalTBT ?? 0).toLocaleString() },
    { label: "Inductions", labelAr: "تهيئات الموقع", value: String(s.totalInductions ?? 0) },
    { label: "Active permits", labelAr: "تصاريح نشطة", value: String(s.activePermits ?? 0) },
  ];

  const byType = data.breakdown?.byType ?? {};

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/reports"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("Back to reports", "العودة إلى التقارير")}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {email === "ok" && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              {t("Report emailed.", "تم إرسال التقرير بالبريد الإلكتروني.")}
            </span>
          )}
          {email === "failed" && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm text-red-600 dark:text-red-400">
              {t("Email failed: ", "فشل إرسال البريد: ")}{emailDetail}
            </span>
          )}
          {schedule === "on" && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              {t("Monthly email scheduling enabled.", "تم تفعيل الجدولة الشهرية للبريد الإلكتروني.")}
            </span>
          )}
          {schedule === "off" && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-muted px-3 py-1.5 text-sm text-muted-foreground">
              {t("Scheduling disabled.", "تم تعطيل الجدولة.")}
            </span>
          )}
          <PrintButton />
          {can(user.role as never, "reports:export") && (
            <a href={`/api/reports/${report.id}/download/pptx`}>
              <Button variant="outline">
                <Presentation className="h-4 w-4" />
                {t("Download PPTX", "تنزيل PPTX")}
              </Button>
            </a>
          )}
          <a href={`/api/reports/${report.id}/download`}>
            <Button>
              <Download className="h-4 w-4" />
              {t("Download HTML", "تنزيل HTML")}
            </Button>
          </a>
          <a href={`/api/reports/${report.id}/download/pdf`}>
            <Button variant="outline">
              <FileText className="h-4 w-4" />
              {t("Download PDF", "تنزيل PDF")}
            </Button>
          </a>
          {can(user.role as never, "reports:export") && (
            <form action={emailReport} className="flex items-center gap-1.5">
          {email === "revise" && to && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
              <span className="text-amber-700 dark:text-amber-400">
                {t("Review the report before sending to: ", "Review the report before sending to: ")}{to}
              </span>
              <span className="flex items-center gap-1.5">
                <a href={`/reports/${report.id}?email=cancel&to=${encodeURIComponent(String(to))}`} className="text-xs text-muted-foreground hover:underline">
                  {t("Cancel", "Cancel")}
                </a>
              </span>
            </div>
          )}
              <input type="hidden" name="id" value={report.id} />
              <Input
                type="email"
                name="to"
                required
                placeholder="recipient@example.com"
                className="h-9 w-56"
                aria-label={t("Recipient email", "البريد الإلكتروني للمستلم")}
              />
              <Button type="submit" variant="outline" size="sm">
                <Mail className="h-4 w-4" />
                {t("Email", "إرسال بالبريد")}
              </Button>
            </form>
          )}
        </div>
      </div>

      {can(user.role as never, "reports:export") && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 p-3 print:hidden">
          <div className="flex items-center gap-2 text-sm">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{t("Monthly email delivery", "التسليم الشهري عبر البريد الإلكتروني")}</span>
            {report.schedule === "monthly" && (
              <Badge variant="info">
                {t("Scheduled", "مجدول")} · {report.lastSentAt ? `${t("last sent", "آخر إرسال")} ${formatDate(report.lastSentAt, locale)}` : t("never sent", "لم يُرسل بعد")}
              </Badge>
            )}
          </div>
          <form action={toggleReportSchedule} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={report.id} />
            {report.schedule === "monthly" && (
              <Button type="submit" name="enabled" value="0" variant="outline" size="sm">
                {t("Disable", "تعطيل")}
              </Button>
            )}
            {report.schedule !== "monthly" && (
              <>
                <Input
                  type="email"
                  name="emailTo"
                  required
                  defaultValue={report.emailTo ?? ""}
                  placeholder="recipient@example.com"
                  className="h-9 w-56"
                  aria-label={t("Scheduling recipient email", "البريد الإلكتروني للمستلم للجدولة")}
                />
                <Button type="submit" name="enabled" value="1" variant="outline" size="sm">
                  <CalendarClock className="h-4 w-4" />
                  {t("Enable", "تفعيل")}
                </Button>
              </>
            )}
          </form>
          <p className="text-xs text-muted-foreground">
            {t("Deploy a cron job that calls", "انشر وظيفة cron تُستدعى")} <code className="rounded bg-muted px-1">npm run reports:cron</code>{" "}
            {t("every month (CRON_SECRET required).", "كل شهر (يتطلب ضبط CRON_SECRET).")}
          </p>
        </div>
      )}

      <div className="mx-auto max-w-4xl rounded-xl border bg-card p-6 print:max-w-none print:border-0 print:p-0 md:p-10">
        <div className="mb-8 flex items-start justify-between gap-4 border-b pb-6">
          <div>
<p className="text-xs uppercase tracking-widest text-muted-foreground">HSE Dashboard · {tenant.name}</p>
          <h1 className="mt-1 text-2xl font-bold">{report.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("Reporting period: ", "فترة التقرير: ")}{monthText}</p>
        </div>
        <Badge variant="outline">{t("Month", "الشهر")} {data.month != null ? data.month + 1 : ""}</Badge>
      </div>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">{t("Executive summary", "الملخص التنفيذي")}</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {statCards.map((c) => (
              <div key={c.label} className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{t(c.label, c.labelAr)}</p>
                <p className={`mt-0.5 text-xl font-bold ${c.tone ?? ""}`}>{c.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">{t("Incident breakdown", "تفصيل الحوادث")}</h2>
          {Object.keys(byType).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("No incidents recorded.", "لا توجد حوادث مسجلة.")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="pb-2">{t("Type", "النوع")}</th>
                  <th className="pb-2">{t("Count", "العدد")}</th>
                  <th className="pb-2">{t("Lost days", "أيام العمل المفقودة")}</th>
                  <th className="pb-2">{t("Restricted days", "أيام العمل المقيدة")}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byType).map(([type, v]) => {
                  const meta = INCIDENT_TYPE_META[type];
                  return (
                    <tr key={type} className="border-b last:border-0">
                      <td className="py-2">{t(meta?.label ?? type, meta?.labelAr ?? meta?.label ?? type)}</td>
                      <td className="py-2 font-medium">{v.count}</td>
                      <td className="py-2">{v.lostDays}</td>
                      <td className="py-2">{v.restrictedDays}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">{t("Safety performance", "أداء السلامة")}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b py-1.5"><span className="text-muted-foreground">{t("Lost time injuries", "إصابات فقدان الوقت")}</span><span className="font-medium">{s.ltiCount ?? 0}</span></div>
            <div className="flex justify-between border-b py-1.5"><span className="text-muted-foreground">{t("First aid cases", "حالات الإسعافات الأولية")}</span><span className="font-medium">{s.firstAid ?? 0}</span></div>
            <div className="flex justify-between border-b py-1.5"><span className="text-muted-foreground">{t("Findings closed", "الملاحظات المغلقة")}</span><span className="font-medium">{s.closedFindings ?? 0}</span></div>
            <div className="flex justify-between border-b py-1.5"><span className="text-muted-foreground">{t("TBT sessions", "جلسات التوعية")}</span><span className="font-medium">{s.tbtSessions ?? 0}</span></div>
            <div className="flex justify-between border-b py-1.5"><span className="text-muted-foreground">{t("Trainings on file", "التدريبات المسجلة")}</span><span className="font-medium">{s.totalTrainings ?? 0}</span></div>
            {data.training && (
              <div className="flex justify-between border-b py-1.5">
                <span className="text-muted-foreground">{t("Expired certifications", "الشهادات منتهية الصلاحية")}</span>
                <span className={data.training.expired ? "font-medium text-red-600" : "font-medium"}>{(data.training.expired ?? 0)}</span>
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">{t("Notes & recommendations", "الملاحظات والتوصيات")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {report.description}
          </p>
        </section>

        <div className="mt-8 border-t pt-4 text-xs text-muted-foreground">
          {t("Generated by", "أُنشئ بواسطة")} {creator?.name ?? report.createdById ?? data.generatedBy ?? t("HSE team", "فريق الصحة والسلامة")} {t("on", "بتاريخ")}{" "}
          {formatDateTime(data.generatedAt ?? report.createdAt, locale)}
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Record<string, string>> {
  const t = await getT();
  const { id } = await params;
  const report = db.select().from(reports).where(eq(reports.id, id)).get();
  return { title: report ? `${report.title} | HSE Dashboard` : `${t("Report", "تقرير")} | HSE Dashboard` };
}