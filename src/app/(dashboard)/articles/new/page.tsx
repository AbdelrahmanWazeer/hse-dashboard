import { requirePermission } from "@/lib/guards";
import { PageHeader } from "@/components/page-header";
import { ArticleForm } from "@/components/articles/article-form";

export default async function NewArticlePage() {
  await requirePermission("articles:create");
  return (
    <div>
      <PageHeader title="New Article" description="Write an HSE update, safety tip, or announcement" />
      <ArticleForm />
    </div>
  );
}