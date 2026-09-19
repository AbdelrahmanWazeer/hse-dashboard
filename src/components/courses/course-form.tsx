"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FormError, FormSection } from "@/components/ui/form";
import { ImageUploader } from "@/components/ui/image-uploader";
import { useLocale } from "@/components/i18n/locale-provider";
import { COURSE_CATEGORIES, COURSE_LEVELS } from "@/lib/constants";
import { createCourse, updateCourse } from "@/app/(dashboard)/courses/actions";

export type CourseFormData = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  provider: string | null;
  level: string;
  durationMinutes: number;
  coverUrl: string | null;
  courseUrl: string | null;
  tags: string[];
  status: string;
};

export function CourseForm({ initial }: { initial?: CourseFormData }) {
  const { tr } = useLocale();
  const editing = Boolean(initial);
  const [state, formAction, pending] = React.useActionState(editing ? updateCourse : createCourse, {});
  const [cover, setCover] = React.useState<string[]>(initial?.coverUrl ? [initial.coverUrl] : []);

  return (
    <form action={formAction} className="mx-auto max-w-3xl space-y-4">
      {editing && initial && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="coverUrl" value={JSON.stringify(cover)} />
      <Card>
        <CardHeader>
          <CardTitle>{editing ? tr("Edit course", "تعديل الدورة") : tr("New course", "دورة جديدة")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <FormError message={state.error} />
          <FormSection title={tr("Course details", "تفاصيل الدورة")}>
            <Field label={tr("Cover image", "صورة الغلاف")}>
              <ImageUploader value={cover} onChange={setCover} max={1} hint={tr("Optional cover image for the course card.", "صورة غلاف اختيارية لبطاقة الدورة.")} />
            </Field>
            <Field label={tr("Title", "العنوان")} required>
              <Input name="title" required defaultValue={initial?.title} placeholder={tr("e.g. Confined Space Entry (H2S)", "مثال: دخول الأماكن المغلقة (H2S)")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={tr("Category", "الفئة")}>
                <Select name="category" defaultValue={initial?.category ?? "safety"}>
                  {COURSE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {tr(c.label, c.labelAr)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={tr("Level", "المستوى")}>
                <Select name="level" defaultValue={initial?.level ?? "all_levels"}>
                  {COURSE_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {tr(l.label, l.labelAr)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={tr("Provider", "مقدم الدورة")}>
                <Input name="provider" defaultValue={initial?.provider ?? ""} placeholder={tr("e.g. NEBOSH, Udemy, Company academy", "مثال: NEBOSH، Udemy، أكاديمية الشركة")} />
              </Field>
              <Field label={tr("Duration (minutes)", "المدة (بالدقائق)")}>
                <Input type="number" name="durationMinutes" min={0} step={5} defaultValue={initial?.durationMinutes ?? 60} />
              </Field>
            </div>
            <Field label={tr("Course link", "رابط الدورة")}>
              <Input type="url" name="courseUrl" defaultValue={initial?.courseUrl ?? ""} placeholder="https://…" />
            </Field>
            <Field label={tr("Tags", "الوسوم")}>
              <Textarea
                name="tags"
                rows={2}
                defaultValue={initial?.tags?.join(", ") ?? ""}
                placeholder={tr("Comma separated, e.g. H2S, rescue, permit", "مفصولة بفواصل، مثال: H2S، إنقاذ، تصريح")}
              />
            </Field>
            <Field label={tr("Description", "الوصف")}>
              <Textarea name="description" rows={5} defaultValue={initial?.description ?? ""} placeholder={tr("Course outline, objectives, and target audience", "ملخص الدورة والأهداف والجمهور المستهدف")} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="publish" value="1" defaultChecked={editing ? initial?.status === "published" : false} />
              {tr("Publish and show in the catalog", "نشر الدورة وعرضها في الكتالوج")}
            </label>
          </FormSection>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Link
            href={editing && initial ? `/courses/${initial.id}` : "/courses"}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            {tr("Cancel", "إلغاء")}
          </Link>
          <Button type="submit" disabled={pending}>
            {pending
              ? editing
                ? tr("Saving…", "جارٍ الحفظ…")
                : tr("Creating…", "جارٍ الإنشاء…")
              : editing
                ? tr("Save changes", "حفظ التغييرات")
                : tr("Create course", "إنشاء الدورة")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}