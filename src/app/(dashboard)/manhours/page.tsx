import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { manhours, projects } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/misc";
import { deleteManhour } from "./actions";
import { Clock, CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export default async function ManhoursPage() {
  const t = await getT();
  const locale = await getLocale();
  await requirePermission("stats:view");
  const tenant = await getCurrentTenant();

  const projectRows = db.select().from(projects).where(eq(projects.tenantId, tenant.id)).all();
  const projectMap = new Map(projectRows.map((p) => [p.id, p.name]));

  const rows = db.select().from(manhours).where(eq(manhours.tenantId, tenant.id)).orderBy(desc(manhours.date)).limit(250).all();
  const year = new Date().getFullYear();
  const ytd = rows.filter((r) => new Date(r.date).getFullYear() === year).reduce((a, r) => a + r.manhours, 0);
  const total = rows.reduce((a, r) => a + r.manhours, 0);
  const days = new Set(rows.map((r) => new Date(r.date).toDateString())).size;

  const summary = [
    { label: `YTD man-hours (${year})`, labelAr: `ساعات العمل منذ بداية السنة (${year})`, value: ytd.toLocaleString(), icon: <Clock className="h-4 w-4" />, color: "text-sky-600 dark:text-sky-400" },
    { label: "Total man-hours", labelAr: "إجمالي ساعات العمل", value: total.toLocaleString(), icon: <Clock className="h-4 w-4" />, color: "text-teal-600 dark:text-teal-400" },
    { label: "Days recorded", labelAr: "عدد الأيام المسجلة", value: String(days), icon: <CalendarDays className="h-4 w-4" />, color: "text-violet-600 dark:text-violet-400" },
  ];

  return (
    <div>
      <PageHeader title="Man-hours" description="Daily man-hour entries across projects">
        <Link href="/manhours/new">
          <Button>
            <Plus className="h-4 w-4" />
            {t("Add Entry", "إضافة إدخال")}
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        {summary.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-start justify-between p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t(s.label, s.labelAr)}</p>
                <p className="mt-1 text-2xl font-bold">{s.value}</p>
              </div>
              <div className={`rounded-lg bg-muted p-2 ${s.color}`}>{s.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle>{t("Entries", "الإدخالات")}</CardTitle>
          <CardDescription>{t("Most recent first", "الأحدث أولاً")}</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState
              icon={<Clock className="h-8 w-8" />}
              title={t("No man-hour entries yet", "لا توجد إدخالات ساعات عمل بعد")}
              description={t("Add your first daily man-hours entry to start tracking.", "أضف أول إدخال يومي لساعات العمل لبدء المتابعة.")}
              action={
                <Link href="/manhours/new">
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    {t("Add Entry", "إضافة إدخال")}
                  </Button>
                </Link>
              }
            />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell className="font-medium">{t("Date", "التاريخ")}</TableCell>
                  <TableCell className="font-medium">{t("Project", "المشروع")}</TableCell>
                  <TableCell className="font-medium">{t("Man-hours", "ساعات العمل")}</TableCell>
                  <TableCell className="font-medium">{t("Actions", "إجراءات")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-sm">{formatDate(r.date, locale)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.projectId ? projectMap.get(r.projectId) ?? "—" : "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Clock className="h-3 w-3" />
                        {r.manhours.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/manhours/${r.id}/edit`} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input hover:bg-accent">
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <form action={deleteManhour}>
                          <input type="hidden" name="id" value={r.id} />
                          <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input text-destructive hover:bg-accent" title={t("Delete", "حذف")} aria-label={t("Delete record", "حذف السجل")}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}