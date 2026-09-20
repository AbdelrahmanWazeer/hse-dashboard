import { enrollCourse } from "@/app/(dashboard)/courses/actions";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, courseProgress } from "@/lib/db/schema";
import { getDictionary, getLocaleInfo, getT } from "@/lib/i18n";
import { COURSE_CATEGORIES, COURSE_LEVELS, COURSE_STATUS_META } from "@/lib/constants";
import { formatDurationLabel } from "@/app/(dashboard)/courses/course-label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, Clock, Star } from "lucide-react";

export const dynamic = "force-dynamic";

export async function CatalogSection() {
  const dict = await getDictionary();
  const t = dict.catalog;
  const { dir } = await getLocaleInfo();
  const rtl = dir === "rtl";
  const tf = await getT();

  const rows = db
    .select()
    .from(courses)
    .where(eq(courses.status, "published"))
    .orderBy(desc(courses.updatedAt))
    .all();

  const enrolledRows = db.select().from(courseProgress).all();
  const enrolledByCourse = new Map<string, number>();
  for (const p of enrolledRows) {
    if (!p.courseId) continue;
    enrolledByCourse.set(p.courseId, (enrolledByCourse.get(p.courseId) ?? 0) + 1);
  }

  const visible = rows.filter((c) => c.status === "published").slice(0, 9);

  return (
    <section id="courses" className="mx-auto max-w-6xl px-4 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t.title}</h2>
          <p className="mt-2 text-muted-foreground">{t.subtitle}</p>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          {t.emptyTitle}
        </p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((c) => {
            const catMeta = COURSE_CATEGORIES.find((x) => x.value === c.category);
            const levelMeta = COURSE_LEVELS.find((x) => x.value === c.level);
            const statusMeta = COURSE_STATUS_META[c.status];
            return (
              <Card key={c.id} className="overflow-hidden">
                {c.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.coverUrl} alt={c.title} className="aspect-video w-full object-cover" />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-muted">
                    <BookOpen className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {catMeta && (
                      <Badge variant="secondary">{rtl ? catMeta.labelAr : catMeta.label}</Badge>
                    )}
                    {levelMeta && (
                      <Badge variant="outline">{rtl ? levelMeta.labelAr : levelMeta.label}</Badge>
                    )}
                  </div>
                  <h3 className="line-clamp-2 font-semibold leading-snug">{c.title}</h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                  <p className="flex items-center gap-4 text-sm text-muted-foreground">
                    {c.durationMinutes > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {formatDurationLabel(c.durationMinutes, tf)}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {enrolledByCourse.get(c.id) ?? 0}
                    </span>
                  </p>
                  <form action={enrollCourse}>
                    <input type="hidden" name="id" value={c.id} />
                    <Button type="submit" className="w-full">{t.enroll}</Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
