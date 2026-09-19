import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { PageHeader } from "@/components/page-header";
import { ArticleForm } from "@/components/articles/article-form";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("articles:edit");
  const tenant = await getCurrentTenant();
  const { id } = await params;

  const article = db.select().from(articles).where(eq(articles.id, id)).get();
  if (!article || article.tenantId !== tenant.id) notFound();

  return (
    <div>
      <PageHeader title="Edit Article" description={article.title} />
      <ArticleForm
        initial={{
          id: article.id,
          title: article.title,
          slug: article.slug,
          category: article.category,
          excerpt: article.excerpt,
          content: article.content,
          coverImage: article.coverImage,
          status: article.status,
        }}
      />
    </div>
  );
}