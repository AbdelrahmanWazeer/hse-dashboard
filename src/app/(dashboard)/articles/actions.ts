"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, id } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { ARTICLE_CATEGORIES } from "@/lib/constants";
import { slugify } from "@/lib/utils";

export type ArticleFormState = { error?: string };

function s(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function opt(formData: FormData, key: string) {
  const v = s(formData, key);
  return v ? v : null;
}

function buildSlug(title: string, existingSlug?: string | null, articleId?: string) {
  const base = existingSlug?.trim() ? existingSlug : slugify(title);
  if (!base) return null;
  const dup = db.select().from(articles).where(eq(articles.slug, base)).get();
  if (dup && dup.id !== articleId) return `${base}-${Date.now().toString(36)}`;
  return base;
}

export async function createArticle(_state: ArticleFormState, formData: FormData) {
  const user = await requirePermission("articles:create");
  const tenant = await getCurrentTenant();

  const title = s(formData, "title");
  const content = s(formData, "content");
  const category = s(formData, "category");
  const status = s(formData, "status");
  if (!title || !content) return { error: "Title and content are required." };
  if (!ARTICLE_CATEGORIES.includes(category as never)) return { error: "Please choose a category." };
  if (!["draft", "published", "archived"].includes(status)) return { error: "Please choose a status." };

  const now = Date.now();
  const articleId = id("art");
  db.insert(articles)
    .values({
      id: articleId,
      tenantId: tenant.id,
      title,
      slug: buildSlug(title, opt(formData, "slug")),
      category,
      excerpt: opt(formData, "excerpt"),
      content,
      coverImage: opt(formData, "coverImage"),
      status,
      publishedAt: status === "published" ? now : undefined,
      authorId: user.id,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  revalidatePath("/articles");
  redirect(`/articles/${articleId}`);
}

export async function updateArticle(_state: ArticleFormState, formData: FormData) {
  const user = await requirePermission("articles:edit");
  const tenant = await getCurrentTenant();
  const articleId = String(formData.get("id") ?? "");
  const existing = db.select().from(articles).where(eq(articles.id, articleId)).get();
  if (!existing || existing.tenantId !== tenant.id) return { error: "Article not found." };

  const title = s(formData, "title");
  const content = s(formData, "content");
  const category = s(formData, "category");
  const status = s(formData, "status");
  if (!title || !content) return { error: "Title and content are required." };
  if (!ARTICLE_CATEGORIES.includes(category as never)) return { error: "Please choose a category." };
  if (!["draft", "published", "archived"].includes(status)) return { error: "Please choose a status." };

  const now = Date.now();
  const publishing = status === "published" && existing.status !== "published";
  db.update(articles)
    .set({
      title,
      slug: buildSlug(title, opt(formData, "slug"), articleId),
      category,
      excerpt: opt(formData, "excerpt"),
      content,
      coverImage: opt(formData, "coverImage"),
      status,
      publishedAt: publishing ? now : existing.publishedAt,
      authorId: user.id,
      updatedAt: now,
    })
    .where(eq(articles.id, articleId))
    .run();

  revalidatePath("/articles");
  revalidatePath(`/articles/${articleId}`);
  redirect(`/articles/${articleId}`);
}

export async function publishArticle(formData: FormData) {
  const user = await requirePermission("articles:publish");
  const tenant = await getCurrentTenant();
  const articleId = String(formData.get("id") ?? "");
  const existing = db.select().from(articles).where(eq(articles.id, articleId)).get();
  if (!existing || existing.tenantId !== tenant.id) return;
  db.update(articles)
    .set({ status: "published", publishedAt: existing.publishedAt ?? Date.now(), authorId: user.id, updatedAt: Date.now() })
    .where(eq(articles.id, articleId))
    .run();
  revalidatePath("/articles");
  revalidatePath(`/articles/${articleId}`);
}

export async function deleteArticle(formData: FormData) {
  await requirePermission("articles:delete");
  const tenant = await getCurrentTenant();
  const articleId = String(formData.get("id") ?? "");
  const existing = db.select().from(articles).where(eq(articles.id, articleId)).get();
  if (!existing || existing.tenantId !== tenant.id) return;
  db.delete(articles).where(eq(articles.id, articleId)).run();
  revalidatePath("/articles");
  redirect("/articles");
}