"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FormError } from "@/components/ui/form";
import { ImageUploader } from "@/components/ui/image-uploader";
import { useLocale } from "@/components/i18n/locale-provider";
import { ARTICLE_CATEGORIES } from "@/lib/constants";
import { createArticle, updateArticle, type ArticleFormState } from "@/app/(dashboard)/articles/actions";

export type ArticleFormData = {
  id?: string;
  title?: string;
  slug?: string | null;
  category?: string;
  excerpt?: string | null;
  content?: string;
  coverImage?: string | null;
  status?: string;
};

export function ArticleForm({ initial }: { initial?: ArticleFormData }) {
  const { tr } = useLocale();
  const mode = initial?.id ? "edit" : "create";
  async function submit(state: ArticleFormState, fd: FormData): Promise<ArticleFormState> {
    return mode === "edit" ? updateArticle(state, fd) : createArticle(state, fd);
  }
  const [state, formAction, pending] = React.useActionState(submit, {});
  const [cover, setCover] = React.useState(initial?.coverImage ?? "");

  return (
    <form action={formAction} className="mx-auto max-w-2xl space-y-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <Card>
        <CardHeader>
          <CardTitle>{mode === "edit" ? tr("Edit article", "تعديل المقال") : tr("New article", "مقال جديد")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormError message={state.error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tr("Title", "العنوان")} required>
              <Input name="title" required defaultValue={initial?.title ?? ""} placeholder={tr("e.g. Weekly toolbox talk reminder", "مثال: تذكير اجتماع سلامة أسبوعي")} />
            </Field>
            <Field label={tr("Category", "الفئة")} required>
              <Select name="category" required defaultValue={initial?.category ?? "news"}>
                {ARTICLE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{tr(c.label, c.labelAr)}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tr("Status", "الحالة")} required>
              <Select name="status" required defaultValue={initial?.status ?? "draft"}>
                <option value="draft">{tr("Draft", "مسودة")}</option>
                <option value="published">{tr("Published", "منشور")}</option>
                <option value="archived">{tr("Archived", "مؤرشف")}</option>
              </Select>
            </Field>
            <Field label={tr("Cover image", "صورة الغلاف")} hint={tr("Upload an image or paste a URL. Recommended ratio 16:7.", "ارفع صورة أو الصق رابطًا. النسبة الموصى بها 16:7.")}>
              <ImageUploader value={cover ? [cover] : []} max={1} onChange={(urls) => setCover(urls[0] ?? "")} />
              <Input
                name="coverImage"
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder={tr("…or paste an image URL (https://…)", "…أو الصق رابط صورة (https://…)")}
                type="url"
                className="mt-2"
              />
            </Field>
          </div>
          <Field label={tr("Slug", "الرابط المختصر")} hint={tr("Optional — leave blank to auto-generate from the title", "اختياري — اتركه فارغًا لإنشائه تلقائيًا من العنوان")}>
            <Input name="slug" defaultValue={initial?.slug ?? ""} />
          </Field>
          <Field label={tr("Excerpt", "الملخص")} hint={tr("Short summary shown on cards", "ملخص قصير يظهر على البطاقات")}>
            <Textarea name="excerpt" defaultValue={initial?.excerpt ?? ""} rows={2} />
          </Field>
          <Field label={tr("Content", "المحتوى")} required hint={tr("Plain text — blank lines become paragraphs", "نص عادي — الأسطر الفارغة تتحول إلى فقرات")}>
            <Textarea name="content" required defaultValue={initial?.content ?? ""} rows={12} className="min-h-[180px] font-mono text-sm" />
          </Field>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Link href="/articles" className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground">
            {tr("Cancel", "إلغاء")}
          </Link>
          <Button type="submit" disabled={pending}>
            {mode === "edit" ? tr("Save changes", "حفظ التغييرات") : tr("Create article", "إنشاء المقال")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}