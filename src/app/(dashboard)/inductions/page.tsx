import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { inductions, projects } from "@/lib/db/schema";
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
import { deleteInduction } from "./actions";
import { GraduationCap, Pencil, Plus, Trash2, UserCheck } from "lucide-react";
import Link from "next/link";

const STATUS_META: Record<string, { label: string; labelAr: string; variant: "default" | "outline" | "info" | "warning" | "destructive" }> = {
  completed: { label: "Completed", labelAr: "مكتمل", variant: "default" },
  scheduled: { label: "Scheduled", labelAr: "مجدول", variant: "info" },
  expired: { label: "Expired", labelAr: "منتهي الصلاحية", variant: "destructive" },
};

export default async function InductionsPage() {
  const t = await getT();
  const locale = await getLocale();
  await requirePermission("stats:view");
  const tenant = await getCurrentTenant();

  const projectRows = db.select().from(projects).where(eq(projects.tenantId, tenant.id)).all();
  const projectMap = new Map(projectRows.map((p) => [p.id, p.name]));

  const rows = db.select().from(inductions).where(eq(inductions.tenantId, tenant.id)).orderBy(desc(inductions.date)).limit(250).all();

  const total = rows.length;
  const completed = rows.filter((r) => r.status === "completed").length;
  // eslint-disable-next-line react-hooks/purity -- server page rendered per request; current time is the cutoff
  const active = rows.filter((r) => !r.expiryDate || r.expiryDate >= Date.now()).length;

  const summary = [
    { label: "Records", labelAr: "السجلات", value: String(total), icon: <GraduationCap className="h-4 w-4" />, color: "text-sky-600 dark:text-sky-400" },
    { label: "Completed", labelAr: "مكتمل", value: String(completed), icon: <UserCheck className="h-4 w-4" />, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Currently valid", labelAr: "ساري حالياً", value: String(active), icon: <UserCheck className="h-4 w-4" />, color: "text-teal-600 dark:text-teal-400" },
  ];

  return (
    <div>
      <PageHeader title="Inductions" description="Personnel inductions and training records">
        <Link href="/inductions/new">
          <Button>
            <Plus className="h-4 w-4" />
            {t("New Induction", "تهيئة جديدة")}
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
          <CardTitle>{t("All inductions", "جميع التأهيلات")}</CardTitle>
          <CardDescription>{t("Most recent first", "الأحدث أولاً")}</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState
              icon={<GraduationCap className="h-8 w-8" />}
              title={t("No induction records", "لا توجد سجلات تأهيل")}
              description={t("Record your first induction to start tracking personnel.", "سجّل أول تهيئة لبدء متابعة الأفراد.")}
              action={
                <Link href="/inductions/new">
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    {t("New Induction", "تهيئة جديدة")}
                  </Button>
                </Link>
              }
            />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell className="font-medium">{t("Date", "التاريخ")}</TableCell>
                  <TableCell className="font-medium">{t("Personnel", "الأفراد")}</TableCell>
                  <TableCell className="font-medium">{t("Type", "النوع")}</TableCell>
                  <TableCell className="font-medium">{t("Project", "المشروع")}</TableCell>
                  <TableCell className="font-medium">{t("Status", "الحالة")}</TableCell>
                  <TableCell className="font-medium">{t("Expiry", "الانتهاء")}</TableCell>
                  <TableCell className="font-medium">{t("Actions", "إجراءات")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => {
                  const meta = STATUS_META[r.status] ?? { label: r.status, labelAr: r.status, variant: "outline" as const };
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-sm">{formatDate(r.date, locale)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{r.personnelName}</span>
                          {r.company && <span className="text-xs text-muted-foreground">{r.company}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm capitalize text-muted-foreground">{r.inductionType.replace(/_/g, " ")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.projectId ? projectMap.get(r.projectId) ?? "—" : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={meta.variant}>{t(meta.label, meta.labelAr)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.expiryDate ? formatDate(r.expiryDate, locale) : "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link href={`/inductions/${r.id}/edit`} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input hover:bg-accent">
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                          <form action={deleteInduction}>
                            <input type="hidden" name="id" value={r.id} />
                            <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input text-destructive hover:bg-accent" title={t("Delete", "حذف")} aria-label={t("Delete record", "حذف السجل")}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}