import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, users } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { can } from "@/lib/permissions";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ARTICLE_CATEGORIES } from "@/lib/constants";
import { Plus, Newspaper } from "lucide-react";
import Link from "next/link";

const ARTICLE_ACCENTS = ["#0f766e", "#0284c7", "#ca8a04", "#9333ea", "#dc2626"];

export default async function ArticlesPage() {
  const t = await getT();
  const locale = await getLocale();
  const user = await requirePermission("articles:view");
  const tenant = await getCurrentTenant();

  const articleRows = db
    .select()
    .from(articles)
    .where(eq(articles.tenantId, tenant.id))
    .orderBy(desc(articles.publishedAt))
    .all();

  const authorIds = [...new Set(articleRows.map((a) => a.authorId).filter(Boolean))];
  const authors = authorIds.length
    ? db.select().from(users).all().filter((u) => authorIds.includes(u.id))
    : [];
  const authorMap = new Map(authors.map((u) => [u.id, u]));

  const categoryLabel = (c: string) => {
    const cat = ARTICLE_CATEGORIES.find((x) => x.value === c);
    return cat ? t(cat.label, cat.labelAr) : c;
  };

  return (
    <div>
      <PageHeader title="Articles & News" description="HSE communications, safety tips, and announcements">
        {can(user.role as never, "articles:create") && (
          <Link href="/articles/new">
            <Button>
              <Plus className="h-4 w-4" />
              {t("New Article", "مقال جديد")}
            </Button>
          </Link>
        )}
      </PageHeader>

      {articleRows.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <Newspaper className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("No articles yet. Create a post to keep your team informed.", "لا توجد مقالات بعد. أنشئ منشورًا لإبقاء فريقك على اطلاع.")}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articleRows.map((a, i) => {
          const accent = ARTICLE_ACCENTS[i % ARTICLE_ACCENTS.length];
          const author = a.authorId ? authorMap.get(a.authorId) : null;
          return (
            <Link key={a.id} href={`/articles/${a.id}`} className="group block">
              <Card className="h-full overflow-hidden transition-colors group-hover:border-primary/50">
                {a.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.coverImage} alt={a.title} className="aspect-[16/7] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[16/7] w-full items-center justify-center" style={{ background: `${accent}22` }}>
                    <Newspaper className="h-8 w-8" style={{ color: accent }} />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="outline" style={{ borderColor: accent, color: accent }}>
                      {categoryLabel(a.category)}
                    </Badge>
                    {a.status !== "published" && <Badge variant="secondary">{a.status === "archived" ? t("Archived", "مؤرشف") : t("Draft", "مسودة")}</Badge>}
                  </div>
                  <h3 className="line-clamp-2 text-sm font-bold group-hover:text-primary">{a.title}</h3>
                  {a.excerpt && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.excerpt}</p>}
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    {author?.name ?? t("HSE Team", "فريق الصحة والسلامة")} ·{" "}
                    {a.publishedAt ? formatDate(a.publishedAt, locale) : t("Draft", "مسودة")}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}