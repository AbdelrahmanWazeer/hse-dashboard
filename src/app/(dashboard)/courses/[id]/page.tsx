import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { courses, courseProgress } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { can } from "@/lib/permissions";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COURSE_CATEGORIES, COURSE_LEVELS, COURSE_STATUS_META } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { CourseActions } from "@/components/courses/course-actions";
import { CourseDeleteButton } from "@/components/courses/course-delete-button";
import { setCourseStatus } from "../actions";
import { formatDurationLabel } from "../course-label";
import { Clock, Users, BookOpen, Pencil, Tag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePermission("courses:view");
  const t = await getT();
  const locale = await getLocale();
  const tenant = await getCurrentTenant();
  const tenantId = tenant.id;

  const course = db.select().from(courses).where(eq(courses.id, id)).get();
  if (!course || course.tenantId !== tenantId) notFound();

  const canManage = can(user.role as never, "courses:manage");
  if (course.status !== "published" && !canManage) notFound();

  const myProgress = db
    .select()
    .from(courseProgress)
    .where(and(eq(courseProgress.courseId, id), eq(courseProgress.userId, user.id)))
    .get();
  const learnerRows = db.select().from(courseProgress).where(eq(courseProgress.tenantId, tenantId)).all();
  const learners = learnerRows.filter((p) => p.courseId === id).length;

  const catMeta = COURSE_CATEGORIES.find((c) => c.value === course.category);
  const levelMeta = COURSE_LEVELS.find((l) => l.value === course.level);
  const statusMeta = COURSE_STATUS_META[course.status];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground">
          {t("← Back to courses", "→ العودة إلى الدورات")}
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {catMeta && <Badge variant="secondary">{t(catMeta.label, catMeta.labelAr)}</Badge>}
              {levelMeta && <Badge variant="outline">{t(levelMeta.label, levelMeta.labelAr)}</Badge>}
              {statusMeta && (
                <Badge style={{ backgroundColor: `${statusMeta.color}22`, color: statusMeta.color }}>
                  {t(statusMeta.label, statusMeta.labelAr)}
                </Badge>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">{course.title}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {course.provider && <span>{course.provider}</span>}
              {course.durationMinutes > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDurationLabel(course.durationMinutes, t)}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {learners} {t("learners", "متعلم")}
              </span>
            </p>
          </div>
          {canManage && (
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/courses/${course.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4" />
                  {t("Edit", "تعديل")}
                </Button>
              </Link>
              {course.status !== "published" ? (
                <form action={setCourseStatus}>
                  <input type="hidden" name="id" value={course.id} />
                  <input type="hidden" name="status" value="published" />
                  <Button type="submit" size="sm">
                    {t("Publish", "نشر")}
                  </Button>
                </form>
              ) : (
                <form action={setCourseStatus}>
                  <input type="hidden" name="id" value={course.id} />
                  <input type="hidden" name="status" value="draft" />
                  <Button type="submit" variant="outline" size="sm">
                    {t("Unpublish", "إلغاء النشر")}
                  </Button>
                </form>
              )}
              <CourseDeleteButton courseId={course.id} />
            </div>
          )}
        </div>
      </div>

      {canManage && course.status === "draft" && (
        <p className="rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {t(
            "This course is a draft and is only visible to admins. Publish it to make it available to your team.",
            "هذه الدورة مسودة ولا تظهر إلا للمديرين. انشرها لتكون متاحة لفريقك."
          )}
        </p>
      )}

      {course.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={course.coverUrl} alt={course.title} className="aspect-video w-full rounded-xl border object-cover" />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-xl border bg-gradient-to-br from-primary/10 to-primary/5">
          <BookOpen className="h-14 w-14 text-primary/40" />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">{t("About this course", "عن هذه الدورة")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {course.description ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{course.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{t("No description provided.", "لا يوجد وصف.")}</p>
            )}
            {Array.isArray(course.tags) && course.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {course.tags.map((tag, i) => (
                  <Badge key={`${tag}-${i}`} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("Your progress", "تقدمك")}</CardTitle>
            </CardHeader>
            <CardContent>
              <CourseActions
                courseId={course.id}
                courseUrl={course.courseUrl}
                enrollment={
                  myProgress
                    ? { status: myProgress.status, progress: myProgress.progress }
                    : null
                }
              />
              {myProgress?.enrolledAt && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("Enrolled", "سجلت")} {formatDate(myProgress.enrolledAt, locale)}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
              <p>{t("Track completion of external or in-house training courses across the team.", "تتبع إكمال دورات تدريبية خارجية أو داخلية عبر الفريق.")}</p>
              <p>
                {t("To update your progress, use the slider and save.", "لتحديث تقدمك، استخدم شريط التمرير ثم احفظ.")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}