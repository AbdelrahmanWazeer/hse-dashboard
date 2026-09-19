import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { formatDate, monthLabel } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateMonthlyReport, deleteReport } from "./actions";
import { FileText, Download, Plus, Trash2, Printer, Presentation } from "lucide-react";
import Link from "next/link";

export default async function ReportsPage() {
  const t = await getT();
  const locale = await getLocale();
  await requirePermission("reports:view");
  const tenant = await getCurrentTenant();

  const reportRows = db.select().from(reports).where(eq(reports.tenantId, tenant.id)).orderBy(desc(reports.createdAt)).all();

  const typeLabel: Record<string, string> = {
    monthly: "Monthly",
    annual: "Annual",
    finding: "Finding",
    incident: "Incident",
    permit: "Permit",
    custom: "Custom",
  };

  const typeLabelAr: Record<string, string> = {
    monthly: "شهري",
    annual: "سنوي",
    finding: "ملاحظة",
    incident: "حادثة",
    permit: "تصريح",
    custom: "مخصص",
  };

  return (
    <div>
      <PageHeader title="Reports" description="Generated HSE reports and exports">
        <form action={generateMonthlyReport} className="flex items-center gap-2">
          <input
            type="month"
            name="month"
            defaultValue={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
          />
          <Button type="submit">
            <Plus className="h-4 w-4" />
            {t("Generate Monthly Report", "توليد التقرير الشهري")}
          </Button>
        </form>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {reportRows.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t(
                  "No reports generated yet. Use \"Generate Monthly Report\" above to create your first one.",
                  "لا توجد تقارير مولدة بعد. استخدم \"توليد التقرير الشهري\" أعلاه لإنشاء أول تقرير لك."
                )}
              </p>
            </CardContent>
          </Card>
        )}

        {reportRows.map((r) => {
          const data = (r.data ?? {}) as { stats?: { totalManhours?: number; ltiCount?: number; totalIncidents?: number } };
          return (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{r.title}</CardTitle>
                  <Badge variant="outline">{t(typeLabel[r.type] ?? r.type, typeLabelAr[r.type] ?? r.type)}</Badge>
                </div>
                {r.description && <CardDescription className="line-clamp-2">{r.description}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{t("Generated", "أنشئ")}</span>
                  <span>{formatDate(r.createdAt, locale)}</span>
                </div>
                {r.startDate && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>{t("Period", "الفترة")}</span>
                    <span>
                      {`${monthLabel(new Date(r.startDate).getMonth(), locale)} ${new Date(r.startDate).getFullYear()}`}
                    </span>
                  </div>
                )}
                {data.stats && (
                  <div className="rounded-lg bg-muted p-2.5">
                    <div className="flex justify-between py-0.5"><span className="text-muted-foreground">{t("Man-hours", "ساعات العمل")}</span><span className="font-semibold">{data.stats.totalManhours?.toLocaleString() ?? "—"}</span></div>
                    <div className="flex justify-between py-0.5"><span className="text-muted-foreground">{t("Incidents", "الحوادث")}</span><span className="font-semibold">{data.stats.totalIncidents ?? "—"}</span></div>
                    <div className="flex justify-between py-0.5"><span className="text-muted-foreground">{t("LTI", "إصابات فقدان الوقت")}</span><span className="font-semibold">{data.stats.ltiCount ?? "—"}</span></div>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <Link href={`/reports/${r.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Printer className="h-3.5 w-3.5" />
                      {t("View / Print", "عرض / طباعة")}
                    </Button>
                  </Link>
                  <a href={`/api/reports/${r.id}/download`}>
                    <Button variant="ghost" size="icon" title={t("Download HTML", "تنزيل HTML")} aria-label={t("Download report", "تنزيل التقرير")}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                  <a href={`/api/reports/${r.id}/download/pptx`}>
                    <Button variant="ghost" size="icon" title={t("Download PPTX", "تنزيل PPTX")} aria-label={t("Download presentation", "تنزيل العرض التقديمي")}>
                      <Presentation className="h-4 w-4" />
                    </Button>
                  </a>
                  <form action={deleteReport}>
                    <input type="hidden" name="id" value={r.id} />
                    <Button variant="ghost" size="icon" title={t("Delete", "حذف")} aria-label={t("Delete report", "حذف التقرير")} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}