import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, users } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { can } from "@/lib/permissions";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { ARTICLE_CATEGORIES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { publishArticle, deleteArticle } from "@/app/(dashboard)/articles/actions";
import { ArrowLeft, CalendarDays, Pencil, Send, Trash2 } from "lucide-react";
import Link from "next/link";

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const locale = await getLocale();
  const user = await requirePermission("articles:view");
  const tenant = await getCurrentTenant();
  const { id } = await params;
  const canEdit = can(user.role as never, "articles:edit");
  const canPublish = can(user.role as never, "articles:publish");
  const canDelete = can(user.role as never, "articles:delete");

  const article = db.select().from(articles).where(eq(articles.id, id)).get();
  if (!article || article.tenantId !== tenant.id) notFound();

  const author = article.authorId ? db.select().from(users).where(eq(users.id, article.authorId)).get() : null;
  const categoryMeta = ARTICLE_CATEGORIES.find((c) => c.value === article.category);
  const categoryLabel = categoryMeta ? t(categoryMeta.label, categoryMeta.labelAr) : article.category;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/articles"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("Back to articles", "العودة إلى المقالات")}
        </Link>
      </div>

      <article className="rounded-xl border bg-card p-6 md:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge>{categoryLabel}</Badge>
          <Badge variant="secondary">{article.status === "archived" ? t("Archived", "مؤرشف") : article.status === "draft" ? t("Draft", "مسودة") : t("Published", "منشور")}</Badge>
          {article.publishedAt && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              {formatDate(article.publishedAt, locale)}
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold leading-tight md:text-3xl">{article.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("By", "بقلم")} {author?.name ?? t("HSE Team", "فريق الصحة والسلامة")}</p>

        {article.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.coverImage} alt={article.title} className="mt-6 aspect-[16/7] w-full rounded-lg object-cover" />
        )}

        {article.excerpt && (
          <p className="mt-6 border-l-2 border-primary pl-4 text-base font-medium text-muted-foreground">
            {article.excerpt}
          </p>
        )}

        <div className="prose prose-sm mt-6 max-w-none text-sm leading-relaxed dark:prose-invert">
          {article.content.split("\n").map((p, i) =>
            p.trim() ? (
              <p key={i} className="mb-3 empty:hidden">
                {p}
              </p>
            ) : null
          )}
        </div>
      </article>

      <div className="mt-4 flex justify-end gap-2">
        {canEdit && (
          <Link href={`/articles/${article.id}/edit`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4" />
              {t("Edit", "تعديل")}
            </Button>
          </Link>
        )}
        {article.status !== "published" && canPublish && (
          <form action={publishArticle}>
            <input type="hidden" name="id" value={article.id} />
            <Button>
              <Send className="h-4 w-4" />
              {t("Publish", "نشر")}
            </Button>
          </form>
        )}
        {canDelete && (
          <form action={deleteArticle}>
            <input type="hidden" name="id" value={article.id} />
            <Button variant="ghost" className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
              {t("Delete", "حذف")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}