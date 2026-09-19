import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { courses, courseProgress } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { COURSE_CATEGORIES, COURSE_STATUS_META } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { GraduationCap, PlayCircle, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MyLearningPage() {
  const user = await requirePermission("courses:view");
  const t = await getT();
  const locale = await getLocale();
  const tenant = await getCurrentTenant();
  const tenantId = tenant.id;

  const enrolled = db
    .select()
    .from(courseProgress)
    .where(and(eq(courseProgress.tenantId, tenantId), eq(courseProgress.userId, user.id)))
    .all();

  const courseById = new Map(
    db.select().from(courses).where(eq(courses.tenantId, tenantId)).all().map((c) => [c.id, c])
  );

  const ordered = [...enrolled].sort((a, b) => {
    const rank = (s: string) => (s === "in_progress" ? 0 : s === "enrolled" ? 1 : 2);
    return rank(a.status) - rank(b.status) || a.enrolledAt - b.enrolledAt;
  });

  const completed = enrolled.filter((e) => e.status === "completed").length;

  return (
    <div>
      <PageHeader title="My Learning" description="Courses you are enrolled in">
        <Link href="/courses">
          <Button variant="outline">{t("Browse courses", "تصفح الدورات")}</Button>
        </Link>
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t("Enrolled courses", "الدورات المسجلة")}</p>
            <p className="text-2xl font-bold">{enrolled.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t("Completed", "المكتملة")}</p>
            <p className="text-2xl font-bold">{completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t("In progress", "قيد التقدم")}</p>
            <p className="text-2xl font-bold">{enrolled.filter((e) => e.status === "in_progress").length}</p>
          </CardContent>
        </Card>
      </div>

      {ordered.length === 0 && (
        <p className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          {t(
            "You haven't enrolled in any courses yet. Browse the catalog and pick your next lesson.",
            "لم تسجل في أي دورة بعد. تصفح الكتالوج واختر درسك القادم."
          )}
        </p>
      )}

      <div className="space-y-3">
        {ordered.map((p) => {
          const c = courseById.get(p.courseId);
          if (!c) return null;
          const catMeta = COURSE_CATEGORIES.find((x) => x.value === c.category);
          const statusMeta = COURSE_STATUS_META[c.status];
          const isDone = p.status === "completed";
          return (
            <Card key={p.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="flex min-w-[220px] flex-1 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : p.status === "in_progress" ? (
                      <PlayCircle className="h-5 w-5 text-amber-500" />
                    ) : (
                      <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/courses/${c.id}`} className="block truncate font-semibold hover:underline">
                      {c.title}
                    </Link>
                    <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {catMeta && <span>{t(catMeta.label, catMeta.labelAr)}</span>}
                      {statusMeta && (
                        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                          {t(statusMeta.label, statusMeta.labelAr)}
                        </Badge>
                      )}
                      <span>{t("Enrolled", "سجلت")} {formatDate(p.enrolledAt, locale)}</span>
                    </p>
                    <div className="mt-1.5 max-w-md">
                      <Progress value={p.progress} className="h-1.5" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium tabular-nums">{p.progress}%</span>
                  <Link href={`/courses/${c.id}`}>
                    <Button size="sm" variant={isDone ? "outline" : "default"}>
                      {isDone ? t("Review", "مراجعة") : t("Continue", "متابعة")}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}