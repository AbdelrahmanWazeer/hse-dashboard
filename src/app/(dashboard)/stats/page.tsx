import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { tbtRecords, inductions, trainings, workPermits, manhours, manpower } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { formatDate, monthLabel } from "@/lib/utils";
import { getMonthlySeries, getTrainingStats } from "@/lib/queries";
import { PERMIT_TYPE_LABELS, PERMIT_TYPE_LABELS_AR, PERMIT_STATUS_META } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar } from "@/components/ui/misc";
import { Progress } from "@/components/ui/progress";
import { AreaChartCard, BarChartCard, MultiBarChartCard, DonutChartCard } from "@/components/charts";

type TimeRange = "week" | "month" | "quarter" | "year" | "project";

function rangeStartTs(range: TimeRange): number {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  switch (range) {
    case "week":
      return now - 7 * day;
    case "quarter":
      return now - 91 * day;
    case "year":
      return now - 365 * day;
    case "project":
      return 0;
    default:
      return now - 30 * day;
  }
}

const RANGE_OPTS: { key: TimeRange; label: string }[] = [
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "quarter", label: "This quarter" },
  { key: "year", label: "This year" },
  { key: "project", label: "Project to date" },
];

export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const range = (["week", "month", "quarter", "year", "project"].includes(sp.range ?? "")
    ? sp.range
    : "project") as TimeRange;
  const cutoff = rangeStartTs(range);
  const t = await getT();
  const locale = await getLocale();
  await requirePermission("stats:view");
  const tenant = await getCurrentTenant();
  const tenantId = tenant.id;
  const year = new Date().getFullYear();

  const [series, training, tbtRows, inductionRows, trainingRows, permitRows, mhRows, mpRows] = await Promise.all([
    getMonthlySeries(tenantId),
    getTrainingStats(tenantId),
    db.select().from(tbtRecords).where(and(eq(tbtRecords.tenantId, tenantId), gte(tbtRecords.date, cutoff))).all(),
    db.select().from(inductions).where(and(eq(inductions.tenantId, tenantId), gte(inductions.date, cutoff))).all(),
    db.select().from(trainings).where(and(eq(trainings.tenantId, tenantId), gte(trainings.date, cutoff))).all(),
    db.select().from(workPermits).where(and(eq(workPermits.tenantId, tenantId), gte(workPermits.startDate, cutoff))).all(),
    db.select().from(manhours).where(and(eq(manhours.tenantId, tenantId), gte(manhours.date, cutoff))).all(),
    db.select().from(manpower).where(and(eq(manpower.tenantId, tenantId), gte(manpower.date, cutoff))).all(),
  ]);

  const prevCap = cutoff > 0 ? cutoff - (Date.now() - cutoff) : null;
  let prevMh = 0, prevTbt = 0, prevInd = 0, prevTrn = 0;
  if (prevCap !== null) {
    const [pMh, pTbt, pInd, pTrn] = await Promise.all([
      db.select().from(manhours).where(and(eq(manhours.tenantId, tenantId), gte(manhours.date, prevCap), lt(manhours.date, cutoff))).all(),
      db.select().from(tbtRecords).where(and(eq(tbtRecords.tenantId, tenantId), gte(tbtRecords.date, prevCap), lt(tbtRecords.date, cutoff))).all(),
      db.select().from(inductions).where(and(eq(inductions.tenantId, tenantId), gte(inductions.date, prevCap), lt(inductions.date, cutoff))).all(),
      db.select().from(trainings).where(and(eq(trainings.tenantId, tenantId), gte(trainings.date, prevCap), lt(trainings.date, cutoff))).all(),
    ]);
    prevMh = pMh.reduce((a, r) => a + r.manhours, 0);
    prevTbt = pTbt.reduce((a, r) => a + r.attendees, 0);
    prevInd = pInd.length;
    prevTrn = pTrn.length;
  }
  const totalManhours = mhRows.reduce((a, r) => a + r.manhours, 0);
  const totalTBTAttendees = tbtRows.reduce((a, r) => a + r.attendees, 0);
  const totalInductions = inductionRows.length;
  const totalTrainings = trainingRows.length;

  const trainingByType = trainingRows.reduce<Record<string, number>>((acc, t) => {
    acc[t.trainingType] = (acc[t.trainingType] ?? 0) + 1;
    return acc;
  }, {});

  const permitsByType = permitRows.reduce<Record<string, number>>((acc, p) => {
    acc[p.permitType] = (acc[p.permitType] ?? 0) + 1;
    return acc;
  }, {});

  const permitsByStatus = permitRows.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  const months = new Array(12).fill(0).map((_, i) => monthLabel(i, locale));

  const tbtMonthly = months.map((label, i) => {
    const rows = tbtRows.filter((r) => {
      const d = new Date(r.date);
      return d.getFullYear() === year && d.getMonth() === i;
    });
    return { label, sessions: rows.length, attendees: rows.reduce((a, r) => a + r.attendees, 0) };
  });

  const inductionMonthly = months.map((label, i) => {
    const rows = inductionRows.filter((r) => {
      const d = new Date(r.date);
      return d.getFullYear() === year && d.getMonth() === i;
    });
    return { label, count: rows.length };
  });

  const recentTbt = [...tbtRows].sort((a, b) => b.date - a.date).slice(0, 8);
  const recentInductions = [...inductionRows].sort((a, b) => b.date - a.date).slice(0, 8);
  const expiringTrainings = trainingRows
    // eslint-disable-next-line react-hooks/purity -- server page rendered per request; current time is the cutoff
    .filter((t) => t.expiryDate != null && t.expiryDate > Date.now())
    .sort((a, b) => a.expiryDate! - b.expiryDate!)
    .slice(0, 8);

  const safetyPerformance = [
    { label: "Man-hours recorded", labelAr: "ساعات العمل المسجلة", value: totalManhours.toLocaleString(), unit: "hours", unitAr: "ساعة", pct: 100 },
    { label: "TBT sessions", labelAr: "جلسات التوعية", value: `${tbtRows.length}`, unit: `sessions · ${totalTBTAttendees.toLocaleString()} attendees`, unitAr: `جلسة · ${totalTBTAttendees.toLocaleString()} مشارك`, pct: 100 },
    { label: "Inductions", labelAr: "تهيئات الموقع", value: totalInductions.toLocaleString(), unit: "personnel", unitAr: "شخص", pct: 100 },
    { label: "Certified trainings", labelAr: "التدريبات المعتمدة", value: totalTrainings.toLocaleString(), unit: "records", unitAr: "سجل", pct: 100 },
  ];

  return (
    <div>
      <PageHeader title="HSE Statistics" description={`Operational safety statistics for ${year}`} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {safetyPerformance.map((s, i) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{t(s.label, s.labelAr)}</p>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
              {[prevMh, prevTbt, prevInd, prevTrn][i] > 0 && (
                <p className="text-xs font-medium text-sky-700">{t("vs prev", "vs prev")} {Math.round((({ Manhours: totalManhours, "TBT sessions": totalTBTAttendees, Inductions: totalInductions, "Certified trainings": totalTrainings } as Record<string, number>)[s.label] - [prevMh, prevTbt, prevInd, prevTrn][i]) / [prevMh, prevTbt, prevInd, prevTrn][i] * 100)}%</p>
              )}
              <p className="text-xs text-muted-foreground">{t(s.unit, s.unitAr)}</p>
              <Progress value={s.pct} className="mt-3" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("Man-hours vs Manpower", "ساعات العمل مقابل القوى العاملة")}</CardTitle>
            <CardDescription>{t("Monthly", "شهري")} {year} — {t("man-hours driven by headcount", "ساعات العمل مدفوعة بعدد الموظفين")}</CardDescription>
          </CardHeader>
          <CardContent>
            <MultiBarChartCard
              data={series.manhours.map((m, i) => ({ ...m, manpower: series.manpower[i]?.manpower ?? 0 })) as never}
              series={[
                { key: "manhours", name: t("Man-hours", "ساعات العمل"), color: "#0f766e" },
                { key: "manpower", name: t("Avg headcount", "متوسط عدد الموظفين"), color: "#8b5cf6" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("Incident mix", "مزيج الحوادث")}</CardTitle>
            <CardDescription>{t("Distribution of incident types", "توزيع أنواع الحوادث")}</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChartCard data={(series.incidents as never)} dataKey="value" name={t("Incidents", "الحوادث")} color="#ef4444" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("TBT sessions", "جلسات التوعية")}</CardTitle>
            <CardDescription>{t("Sessions and total attendance by month", "الجلسات وإجمالي الحضور حسب الشهر")}</CardDescription>
          </CardHeader>
          <CardContent>
            <MultiBarChartCard
              data={tbtMonthly as never}
              series={[
                { key: "sessions", name: t("Sessions", "الجلسات"), color: "#0284c7" },
                { key: "attendees", name: t("Attendees", "المشاركون"), color: "#0f766e" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("Inductions by month", "تهيئات الموقع حسب الشهر")}</CardTitle>
            <CardDescription>{t("New site inductions", "تهيئات موقع جديدة")}</CardDescription>
          </CardHeader>
          <CardContent>
            <AreaChartCard data={inductionMonthly as never} dataKey="count" name={t("Inductions", "التهيئات")} color="#ca8a04" />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("Permits by type", "التصاريح حسب النوع")}</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChartCard
              data={Object.entries(permitsByType).map(([k, v]) => ({ name: t(PERMIT_TYPE_LABELS[k] ?? k, PERMIT_TYPE_LABELS_AR[k] ?? k), value: v }))}
              colors={["#0f766e", "#0284c7", "#ca8a04", "#9333ea", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#64748b", "#22c55e"]}
              height={220}
              centerValue={permitRows.length}
              centerLabel={t("Permits", "التصاريح")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("Training health", "صحة التدريب")}</CardTitle>
            <CardDescription>{t("Certification validity snapshot", "لقطة لصلاحية الشهادات")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("Valid", "صالح")}</span>
              <span className="font-medium">{training.valid}</span>
            </div>
            <Progress value={(training.valid / Math.max(1, training.total)) * 100} indicatorClassName="bg-emerald-500" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("Expiring < 90 days", "تنتهي خلال أقل من 90 يومًا")}</span>
              <span className="font-medium">{training.expiring}</span>
            </div>
            <Progress value={(training.expiring / Math.max(1, training.total)) * 100} indicatorClassName="bg-amber-500" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("Expired", "منتهية")}</span>
              <span className="font-medium text-red-600 dark:text-red-400">{training.expired}</span>
            </div>
            <Progress value={(training.expired / Math.max(1, training.total)) * 100} indicatorClassName="bg-red-500" />
            <p className="pt-2 text-xs text-muted-foreground">
              {training.expired > 0
                ? `${training.expired} ${training.expired === 1 ? t("certification", "شهادة") : t("certifications", "شهادات")} ${t("require renewal.", "تحتاج إلى تجديد.")}`
                : t("All certifications are valid.", "جميع الشهادات سارية الصلاحية.")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("Permit status", "حالة التصاريح")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(permitsByStatus).map(([k, v]) => {
              const meta = PERMIT_STATUS_META[k];
              return (
                <div key={k} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: meta?.color }} />
                    {t(meta?.label ?? k, meta?.labelAr ?? meta?.label ?? k)}
                  </span>
                  <span className="font-semibold">{v}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle>{t("Recent TBT sessions", "أحدث جلسات التوعية")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentTbt.map((tb) => (
              <div key={tb.id} className="rounded-lg border p-2.5">
                <p className="text-sm font-medium">{tb.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(tb.date, locale)} · {tb.attendees} {t("attendees", "مشارك")} · {tb.durationMinutes ?? 0} {t("min", "دقيقة")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle>{t("Recent inductions", "أحدث التهيئات")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentInductions.map((i) => (
              <div key={i.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                <Avatar name={i.personnelName} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{i.personnelName}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.company} · {formatDate(i.date, locale)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle>{t("Expiring certifications", "الشهادات التي تنتهي قريبًا")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {expiringTrainings.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("No certs expiring soon.", "لا توجد شهادات تنتهي قريبًا.")}</p>
            )}
            {expiringTrainings.map((trn) => (
              <div key={trn.id} className="rounded-lg border p-2.5">
                <p className="text-sm font-medium">{trn.courseName}</p>
                <p className="text-xs text-muted-foreground">{trn.personnelName} · {t("expires", "ينتهي في")} {formatDate(trn.expiryDate!, locale)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}