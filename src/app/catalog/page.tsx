import { eq, desc, and } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { courses, courseProgress, type Course, type CourseProgress } from "@/lib/db/schema";
import { getDictionary, getLocaleInfo, getT } from "@/lib/i18n";
import { COURSE_CATEGORIES, COURSE_LEVELS, COURSE_STATUS_META } from "@/lib/constants";
import { formatDurationLabel } from "@/app/(dashboard)/courses/course-label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Search, BookOpen, Clock, Users, Filter } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const dict = await getDictionary();
  const t = dict.catalog;
  const { dir } = await getLocaleInfo();
  const rtl = dir === "rtl";
  const tf = await getT();

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.toLowerCase() : "";
  const cat = typeof params.cat === "string" ? params.cat : "";
  const level = typeof params.level === "string" ? params.level : "";

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

  const visible = rows.filter((c) => {
    if (cat && c.category !== cat) return false;
    if (level && c.level !== level) return false;
    if (q) {
      const haystack = [c.title, c.description, c.provider ?? "", c.tags?.join(" ") ?? ""]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold">{dict.brand.name}</p>
              <p className="hidden text-[10px] text-muted-foreground sm:block">{dict.brand.tagline}</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <Link href="/catalog" className="text-foreground">
              {dict.landing.nav.catalog}
            </Link>
            <Link href="/pricing" className="transition-colors hover:text-foreground">
              {dict.landing.nav.pricing}
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link href="/login">
              <Button>{dict.landing.nav.signIn}</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t.title}</h1>
          <p className="mt-3 text-muted-foreground">{t.subtitle}</p>
        </div>

        <form method="get" className="mt-8 flex flex-wrap items-end gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={q} className="ps-9" placeholder={t.searchPlaceholder} />
          </div>
          <Select name="cat" defaultValue={cat} className="w-44">
            <option value="">{t.allCategories}</option>
            {COURSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {rtl ? c.labelAr : c.label}
              </option>
            ))}
          </Select>
          <Select name="level" defaultValue={level} className="w-40">
            <option value="">{t.allLevels}</option>
            {COURSE_LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {rtl ? l.labelAr : l.label}
              </option>
            ))}
          </Select>
          <Button type="submit">
            <Filter className="h-4 w-4" />
            {tf("Apply filters", "تطبيق الفلاتر")}
          </Button>
        </form>

        {visible.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            {t.emptyTitle} — {t.emptySubtitle}
          </p>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                      {statusMeta && (
                        <Badge style={{ backgroundColor: `${statusMeta.color}22`, color: statusMeta.color }}>
                          {statusMeta.label}
                        </Badge>
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
                    <Link href="/login" className="w-full">
                      <Button className="w-full">{t.enroll}</Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
