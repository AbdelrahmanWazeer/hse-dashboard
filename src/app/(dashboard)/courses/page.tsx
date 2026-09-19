import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, courseProgress } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { can } from "@/lib/permissions";
import { getCurrentTenant } from "@/lib/tenant";
import { getT } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { COURSE_CATEGORIES, COURSE_LEVELS, COURSE_STATUS_META } from "@/lib/constants";
import { formatDurationLabel } from "./course-label";
import Link from "next/link";
import { BookOpen, Clock, Search, Users, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.toLowerCase() : "";
  const cat = typeof params.cat === "string" ? params.cat : "";
  const level = typeof params.level === "string" ? params.level : "";
  const mine = typeof params.mine === "string" ? params.mine === "1" : true;
  const status = typeof params.status === "string" ? params.status : "";

  const user = await requirePermission("courses:view");
  const t = await getT();
  const tenant = await getCurrentTenant();
  const tenantId = tenant.id;

  const canManage = can(user.role as never, "courses:manage");

  const rows = db.select().from(courses).where(eq(courses.tenantId, tenantId)).all();
  const progressRows = db
    .select()
    .from(courseProgress)
    .where(and(eq(courseProgress.tenantId, tenantId), eq(courseProgress.userId, user.id)))
    .all();
  const allProgress = db.select().from(courseProgress).where(eq(courseProgress.tenantId, tenantId)).all();

  const myProgressByCourse = new Map(progressRows.map((p) => [p.courseId, p]));
  const enrolledCountByCourse = allProgress.reduce<Record<string, number>>((acc, p) => {
    acc[p.courseId] = (acc[p.courseId] ?? 0) + 1;
    return acc;
  }, {});

  const visible = rows.filter((c) => {
    if (mine && !myProgressByCourse.has(c.id)) return false;
    if (canManage) {
      if (status && c.status !== status) return false;
    } else if (c.status !== "published") {
      return false;
    }
    if (cat && c.category !== cat) return false;
    if (level && c.level !== level) return false;
    if (q) {
      const haystack = [c.title, c.provider ?? "", (c.tags ?? []).join(" ")].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const myEnrolled = myProgressByCourse.size;
  const myCompleted = [...myProgressByCourse.values()].filter((p) => p.status === "completed").length;
  const learners = allProgress.length;

  return (
    <div>
      <PageHeader title="Courses" description="Training & course catalog for your team">
        <Link href="/courses/my">
          <Button variant="outline">
            <GraduationCap className="h-4 w-4" />
            {t("My Learning", "دوري التدريبي")}
          </Button>
        </Link>
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("Total courses", "إجمالي الدورات")}</p>
              <p className="text-2xl font-bold">{rows.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("My enrollments", "دوراتي المسجلة")}</p>
              <p className="text-2xl font-bold">{myEnrolled}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("Total learners", "إجمالي المتعلمين")}</p>
              <p className="text-2xl font-bold">{learners}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("Completed by me", "أكملتها")}</p>
              <p className="text-2xl font-bold">{myCompleted}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} className="pl-8" placeholder={t("Search courses…", "ابحث عن دورات…")} />
        </div>
        <Select name="cat" defaultValue={cat} className="w-44">
          <option value="">{t("All categories", "جميع الفئات")}</option>
          {COURSE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {t(c.label, c.labelAr)}
            </option>
          ))}
        </Select>
        <Select name="level" defaultValue={level} className="w-40">
          <option value="">{t("All levels", "جميع المستويات")}</option>
          {COURSE_LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {t(l.label, l.labelAr)}
            </option>
          ))}
        </Select>
        {canManage && (
          <Select name="status" defaultValue={status} className="w-40">
            <option value="">{t("All statuses", "جميع الحالات")}</option>
            {Object.entries(COURSE_STATUS_META).map(([v, m]) => (
              <option key={v} value={v}>
                {t(m.label, m.labelAr)}
              </option>
            ))}
          </Select>
        )}
        <label className="flex h-9 items-center gap-2 text-sm">
          <input type="checkbox" name="mine" value="1" defaultChecked={mine} />
          {t("Only enrolled", "المسجلة فقط")}
        </label>
        <Button type="submit">{t("Filter", "تصفية")}</Button>
      </form>

      {canManage && (
        <div className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {t(
            `Showing ${visible.length} of ${rows.length} courses`,
            `${visible.length} من أصل ${rows.length} دورة معروضة`
          )}
        </div>
      )}

      {visible.length === 0 && (
        <p className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          {t(
            "No courses match your filters. Try clearing them or create a new course.",
            "لا توجد دورات تطابق عوامل التصفية. جرّب مسحها أو أنشئ دورة جديدة."
          )}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((c) => {
          const catMeta = COURSE_CATEGORIES.find((x) => x.value === c.category);
          const levelMeta = COURSE_LEVELS.find((x) => x.value === c.level);
          const statusMeta = canManage ? COURSE_STATUS_META[c.status] : null;
          const mineRow = myProgressByCourse.get(c.id);
          const enrolledCount = enrolledCountByCourse[c.id] ?? 0;
          return (
            <Link key={c.id} href={`/courses/${c.id}`} className="group">
              <Card className="overflow-hidden transition-shadow group-hover:shadow-md">
                {c.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.coverUrl} alt={c.title} className="aspect-video w-full object-cover" />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <BookOpen className="h-10 w-10 text-primary/40" />
                  </div>
                )}
                <CardContent className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {catMeta && <Badge variant="secondary">{t(catMeta.label, catMeta.labelAr)}</Badge>}
                    {levelMeta && <Badge variant="outline">{t(levelMeta.label, levelMeta.labelAr)}</Badge>}
                    {statusMeta && (
                      <Badge style={{ backgroundColor: `${statusMeta.color}22`, color: statusMeta.color }}>
                        {t(statusMeta.label, statusMeta.labelAr)}
                      </Badge>
                    )}
                  </div>
                  <h3 className="line-clamp-2 font-semibold leading-snug">{c.title}</h3>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    {c.provider && <span>{c.provider}</span>}
                    {c.durationMinutes > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDurationLabel(c.durationMinutes, t)}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {enrolledCount}
                    </span>
                  </p>
                  {mineRow && (
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {mineRow.status === "completed"
                            ? t("Completed", "مكتملة")
                            : t(`${mineRow.progress}% complete`, `${mineRow.progress}% مكتملة`)}
                        </span>
                      </div>
                      <Progress value={mineRow.progress} className="h-1.5" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}