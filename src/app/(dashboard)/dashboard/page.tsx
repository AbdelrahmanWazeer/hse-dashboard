import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { findings, articles, incidents } from "@/lib/db/schema";
import { requireUser } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import {
  getYTDStats,
  getMonthlySeries,
  getIncidentBreakdown,
  getTrainingStats,
  getInventoryStats,
} from "@/lib/queries";
import { INCIDENT_TYPE_META, FINDING_STATUS_META, ARTICLE_CATEGORIES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import {
  AreaChartCard,
  BarChartCard,
  LineChartCard,
  DonutChartCard,
} from "@/components/charts";
import {
  Clock,
  HeartPulse,
  AlertTriangle,
  Users,
  HardHat,
  Search,
  TrendingUp,
  FileWarning,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const t = await getT();
  const locale = await getLocale();
  const user = await requireUser();
  const tenant = await getCurrentTenant();
  const tenantId = tenant.id;

  const [stats, series, breakdown, training, inventory] = await Promise.all([
    getYTDStats(tenantId),
    getMonthlySeries(tenantId),
    getIncidentBreakdown(tenantId),
    getTrainingStats(tenantId),
    getInventoryStats(tenantId),
  ]);

  const [recentFindings, recentArticles, recentIncidents] = await Promise.all([
    db.select().from(findings).where(eq(findings.tenantId, tenantId)).orderBy(desc(findings.createdAt)).limit(6).all(),
    db.select().from(articles).where(eq(articles.tenantId, tenantId)).orderBy(desc(articles.publishedAt)).limit(4).all(),
    db.select().from(incidents).where(eq(incidents.tenantId, tenantId)).orderBy(desc(incidents.date)).limit(8).all(),
  ]);

  const ytd = stats;

  const incidentPieData = Object.entries(ytd.byType).map(([type, count]) => {
    const meta = INCIDENT_TYPE_META[type];
    return {
      name: t(meta?.label ?? type, meta?.labelAr ?? meta?.label ?? type),
      value: count,
    };
  });

  const findingStatusPie = [
    { name: t("Open", "مفتوح"), value: stats.openFindings },
    { name: t("Closed", "مغلق"), value: stats.closedFindings },
  ].filter((d) => d.value > 0);

  const ltiSeries = series.lti;

  const kpis = [
    {
      label: "Man-hours (YTD)",
      labelAr: "ساعات العمل (منذ بداية السنة)",
      value: ytd.totalManhours.toLocaleString(),
      sub: `${ytd.totalManhours.toLocaleString()} total this year`,
      subAr: `${ytd.totalManhours.toLocaleString()} إجمالي هذا العام`,
      icon: <Clock className="h-4 w-4" />,
      color: "text-sky-600 dark:text-sky-400",
      href: "/stats",
    },
    {
      label: "Incidents (YTD)",
      labelAr: "الحوادث (منذ بداية السنة)",
      value: String(ytd.totalIncidents),
      sub: `${ytd.ltiCount} LTI · ${ytd.recordable} recordable`,
      subAr: `${ytd.ltiCount} إصابة فقدان وقت · ${ytd.recordable} حالة قابلة للتسجيل`,
      icon: <AlertTriangle className="h-4 w-4" />,
      color: ytd.totalIncidents > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600",
      href: "/incidents",
    },
    {
      label: "LTI Rate",
      labelAr: "معدل إصابات فقدان الوقت",
      value: ytd.ltir.toFixed(2),
      sub: "per 200,000 man-hours",
      subAr: "لكل 200,000 ساعة عمل",
      icon: <TrendingUp className="h-4 w-4" />,
      color: "text-red-600 dark:text-red-400",
      href: "/incidents",
    },
    {
      label: "Open Findings",
      labelAr: "الملاحظات المفتوحة",
      value: String(ytd.openFindings),
      sub: `${ytd.criticalFindings} critical`,
      subAr: `${ytd.criticalFindings} حرجة`,
      icon: <Search className="h-4 w-4" />,
      color: ytd.criticalFindings > 0 ? "text-red-600 dark:text-red-400" : "text-teal-600 dark:text-teal-400",
      href: "/findings",
    },
    {
      label: "Active Permits",
      labelAr: "التصاريح النشطة",
      value: String(ytd.activePermits),
      sub: "currently on site",
      subAr: "حاليًا في الموقع",
      icon: <FileWarning className="h-4 w-4" />,
      color: "text-emerald-600 dark:text-emerald-400",
      href: "/permits",
    },
    {
      label: "Avg Manpower",
      labelAr: "متوسط القوى العاملة",
      value: Math.round(ytd.maxHeadcount).toLocaleString(),
      sub: "peak headcount this year",
      subAr: "أعلى عدد موظفين هذا العام",
      icon: <Users className="h-4 w-4" />,
      color: "text-violet-600 dark:text-violet-400",
      href: "/stats",
    },
    {
      label: "PPE Low Stock",
      labelAr: "مخزون معدات الحماية المنخفض",
      value: String(inventory.lowStock),
      sub: `${inventory.totalItems} item types tracked`,
      subAr: `${inventory.totalItems} نوعًا من الأصناف متتبع`,
      icon: <HardHat className="h-4 w-4" />,
      color: inventory.lowStock > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400",
      href: "/inventory",
    },
    {
      label: "Training Validity",
      labelAr: "صلاحية التدريب",
      value: `${training.expired}`,
      sub: `${training.expiring} expiring within 90 days`,
      subAr: `${training.expiring} تنتهي خلال 90 يومًا`,
      icon: <HeartPulse className="h-4 w-4" />,
      color: training.expired > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400",
      href: "/stats",
    },
  ];

  const welcome = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return t("Good morning", "صباح الخير");
    if (hour < 18) return t("Good afternoon", "طاب يومك");
    return t("Good evening", "مساء الخير");
  })();

  return (
    <div>
      <PageHeader
        title={`${welcome}, ${user.name?.split(" ")[0]} 👋`}
        description={`${tenant.name} · ${t("HSE performance overview for", "نظرة عامة على أداء الصحة والسلامة والبيئة")} ${stats.year}`}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="block">
            <Card className="transition-colors hover:border-primary/50">
              <CardContent className="flex items-start justify-between p-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">{t(k.label, k.labelAr)}</p>
                  <p className="mt-1 truncate text-2xl font-bold">{k.value}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{t(k.sub, k.subAr)}</p>
                </div>
                <div className={`rounded-lg bg-muted p-2 ${k.color}`}>{k.icon}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("Man-hours by month", "ساعات العمل حسب الشهر")}</CardTitle>
            <CardDescription>{t("Cumulative", "إجمالي ساعات العمل لعام")} {stats.year}</CardDescription>
          </CardHeader>
          <CardContent>
            <AreaChartCard data={series.manhours as never} dataKey="manhours" name={t("Man-hours", "ساعات العمل")} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("Incident cumulative", "تراكم الحوادث")}</CardTitle>
            <CardDescription>{t("Running total of incidents by month", "المجموع التراكمي للحوادث حسب الشهر")}</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChartCard
              data={series.incidents as never}
              series={[{ key: "value", name: t("Incidents", "الحوادث"), color: "#ef4444" }]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("Incidents by type", "الحوادث حسب النوع")}</CardTitle>
            <CardDescription>{t("Distribution of", "توزيع حوادث")} {stats.year}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <DonutChartCard
              data={incidentPieData}
              colors={Object.keys(ytd.byType).map((t) => INCIDENT_TYPE_META[t]?.color ?? "#64748b")}
              height={260}
              centerValue={ytd.totalIncidents}
              centerLabel={t("Incidents", "الحوادث")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("Manpower trend", "اتجاه القوى العاملة")}</CardTitle>
            <CardDescription>{t("Peak headcount by month (avg daily)", "أعلى عدد موظفين حسب الشهر (متوسط يومي)")}</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChartCard data={series.manpower as never} dataKey="manpower" name={t("Avg Headcount", "متوسط عدد الموظفين")} color="#8b5cf6" />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle>{t("Findings status", "حالة الملاحظات")}</CardTitle>
            <CardDescription>{t("Open vs closed this year", "المفتوحة مقابل المغلقة هذا العام")}</CardDescription>
          </CardHeader>
          <CardContent>
            {findingStatusPie.length > 0 ? (
              <DonutChartCard
                data={findingStatusPie}
                colors={["#3b82f6", "#22c55e"]}
                height={220}
                centerValue={stats.openFindings + stats.closedFindings}
                centerLabel={t("Findings", "الملاحظات")}
              />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">{t("No findings recorded.", "لا توجد ملاحظات مسجلة.")}</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle>{t("Title lost time injuries", "إصابات فقدان الوقت الإجمالية")}</CardTitle>
            <CardDescription>{t("LTI count by month (no LTI = flat line)", "عدد إصابات فقدان الوقت حسب الشهر (بدون إصابات = خط مستقيم)")}</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChartCard data={ltiSeries as never} dataKey="count" name={t("LTI", "إصابات فقدان الوقت")} color="#ef4444" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle>{t("Recent findings", "أحدث الملاحظات")}</CardTitle>
            <CardDescription>{t("Latest observations recorded", "أحدث الملاحظات المسجلة")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentFindings.map((f) => {
              const statusMeta = FINDING_STATUS_META[f.status];
              return (
                <Link key={f.id} href={`/findings/${f.id}`} className="flex items-center justify-between gap-2 rounded-lg border p-2.5 transition-colors hover:bg-muted">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.findingNo}</p>
                  </div>
                  <Badge variant="outline" style={{ borderColor: statusMeta?.color, color: statusMeta?.color }}>
                    {t(statusMeta?.label ?? f.status, statusMeta?.labelAr ?? statusMeta?.label ?? f.status)}
                  </Badge>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("Recent incidents", "أحدث الحوادث")}</CardTitle>
            <CardDescription>{t("Latest", "أحدث أحداث السلامة")} {stats.year}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentIncidents.map((inc) => {
              const typeMeta = INCIDENT_TYPE_META[inc.incidentType];
              return (
                <Link key={inc.id} href={`/incidents/${inc.id}`} className="flex items-center justify-between gap-2 rounded-lg border p-2.5 transition-colors hover:bg-muted">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: typeMeta?.color }} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{inc.description.length > 40 ? `${inc.description.slice(0, 40)}…` : inc.description}</p>
                      <p className="text-xs text-muted-foreground">{inc.incidentNo} · {formatDate(inc.date, locale)}</p>
                    </div>
                  </div>
                  <Badge variant="outline" style={{ borderColor: typeMeta?.color, color: typeMeta?.color }}>
                    {t(typeMeta?.label ?? inc.incidentType, typeMeta?.labelAr ?? typeMeta?.label ?? inc.incidentType)}
                  </Badge>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("News & announcements", "الأخبار والإعلانات")}</CardTitle>
            <CardDescription>{t("Latest articles published", "أحدث المقالات المنشورة")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentArticles.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("No articles published yet.", "لا توجد مقالات منشورة بعد.")}</p>
            )}
            {recentArticles.map((a) => {
              const cat = ARTICLE_CATEGORIES.find((c) => c.value === a.category);
              return (
                <Link key={a.id} href={`/articles/${a.id}`} className="block rounded-lg border p-3 transition-colors hover:bg-muted">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{a.title}</p>
                    <Badge variant="outline" className="shrink-0">
                      {cat ? t(cat.label, cat.labelAr) : a.category}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.excerpt}</p>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}