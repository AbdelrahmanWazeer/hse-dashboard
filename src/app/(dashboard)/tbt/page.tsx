import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tbtRecords, projects, teamMembers } from "@/lib/db/schema";
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
import { deleteTbt } from "./actions";
import { MessagesSquare, Pencil, Plus, Trash2, Users } from "lucide-react";
import Link from "next/link";

export default async function TbtPage() {
  const t = await getT();
  const locale = await getLocale();
  await requirePermission("stats:view");
  const tenant = await getCurrentTenant();

  const projectRows = db.select().from(projects).where(eq(projects.tenantId, tenant.id)).all();
  const projectMap = new Map(projectRows.map((p) => [p.id, p.name]));
  const memberRows = db.select().from(teamMembers).where(eq(teamMembers.tenantId, tenant.id)).all();
  const memberMap = new Map(memberRows.map((m) => [m.id, m.name]));

  const rows = db.select().from(tbtRecords).where(eq(tbtRecords.tenantId, tenant.id)).orderBy(desc(tbtRecords.date)).limit(250).all();

  const totalSessions = rows.length;
  const totalAttendees = rows.reduce((a, r) => a + r.attendees, 0);
  const avgDuration = rows.length > 0 ? Math.round(rows.reduce((a, r) => a + (r.durationMinutes ?? 0), 0) / rows.length) : 0;

  const summary = [
    { label: t("Sessions", "الجلسات"), value: String(totalSessions), icon: <MessagesSquare className="h-4 w-4" />, color: "text-sky-600 dark:text-sky-400" },
    { label: t("Attendees", "الحضور"), value: totalAttendees.toLocaleString(), icon: <Users className="h-4 w-4" />, color: "text-teal-600 dark:text-teal-400" },
    { label: t("Avg duration", "متوسط المدة"), value: `${avgDuration} ${t("min", "دقيقة")}`, icon: <MessagesSquare className="h-4 w-4" />, color: "text-violet-600 dark:text-violet-400" },
  ];

  return (
    <div>
      <PageHeader title="Toolbox Talks" description="Toolbox talk (TBT) sessions and attendance">
        <Link href="/tbt/new">
          <Button>
            <Plus className="h-4 w-4" />
            {t("Record TBT", "تسجيل محادثة سلامة")}
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        {summary.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-start justify-between p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-2xl font-bold">{s.value}</p>
              </div>
              <div className={`rounded-lg bg-muted p-2 ${s.color}`}>{s.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle>{t("All sessions", "جميع الجلسات")}</CardTitle>
          <CardDescription>{t("Most recent first", "الأحدث أولاً")}</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState
              icon={<MessagesSquare className="h-8 w-8" />}
              title={t("No toolbox talks yet", "لا توجد محادثات سلامة بعد")}
              description={t("Record your first TBT session to start tracking attendance.", "سجل أول جلسة محادثة سلامة لبدء تتبع الحضور.")}
              action={
                <Link href="/tbt/new">
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    {t("Record TBT", "تسجيل محادثة سلامة")}
                  </Button>
                </Link>
              }
            />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell className="font-medium">{t("Date", "التاريخ")}</TableCell>
                  <TableCell className="font-medium">{t("Title", "العنوان")}</TableCell>
                  <TableCell className="font-medium">{t("Conducted by", "مقدم الجلسة")}</TableCell>
                  <TableCell className="font-medium">{t("Attendees", "الحضور")}</TableCell>
                  <TableCell className="font-medium">{t("Duration", "المدة")}</TableCell>
                  <TableCell className="font-medium">{t("Actions", "إجراءات")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-sm">{formatDate(r.date, locale)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{r.title}</span>
                        {r.topic && <span className="text-xs text-muted-foreground">{r.topic}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{memberMap.get(r.conductedBy ?? "") ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Users className="h-3 w-3" />
                        {r.attendees}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.durationMinutes ? `${r.durationMinutes} ${t("min", "دقيقة")}` : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/tbt/${r.id}/edit`} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input hover:bg-accent">
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <form action={deleteTbt}>
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