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
import { createTbt, updateTbt, type TbtFormState } from "@/app/(dashboard)/tbt/actions";
import { toDateInputValue } from "@/lib/utils";

export type TbtFormData = {
  id?: string;
  projectId?: string | null;
  title?: string;
  topic?: string | null;
  date?: number;
  conductedById?: string | null;
  attendees?: number;
  durationMinutes?: number | null;
  notes?: string | null;
  photoUrls?: string[];
};

export function TbtForm({
  initial,
  projects,
  teamMembers,
}: {
  initial?: TbtFormData;
  projects: { id: string; name: string }[];
  teamMembers: { id: string; name: string }[];
}) {
  const { tr } = useLocale();
  const mode = initial?.id ? "edit" : "create";
  async function submit(state: TbtFormState, fd: FormData): Promise<TbtFormState> {
    return mode === "edit" ? updateTbt(state, fd) : createTbt(state, fd);
  }
  const [state, formAction, pending] = React.useActionState(submit, {});
  const [photos, setPhotos] = React.useState<string[]>(initial?.photoUrls ?? []);

  return (
    <form action={formAction} className="mx-auto max-w-2xl space-y-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="photoUrls" value={JSON.stringify(photos)} />
      <Card>
        <CardHeader>
          <CardTitle>{mode === "edit" ? tr("Edit toolbox talk", "تعديل محادثة سلامة") : tr("Record toolbox talk", "تسجيل محادثة سلامة")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <FormError message={state.error} />
          <FormSection title={tr("Session details", "تفاصيل الجلسة")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={tr("Title", "العنوان")} required>
                <Input name="title" required defaultValue={initial?.title ?? ""} placeholder={tr("e.g. Week 38 safety briefing", "مثال: إيجاز سلامة الأسبوع 38")} />
              </Field>
              <Field label={tr("Topic", "الموضوع")}>
                <Input name="topic" defaultValue={initial?.topic ?? ""} placeholder={tr("e.g. Working at height hazards", "مثال: مخاطر العمل على المرتفعات")} />
              </Field>
              <Field label={tr("Date", "التاريخ")} required>
                <Input type="date" name="date" required defaultValue={toDateInputValue(initial?.date)} />
              </Field>
              <Field label={tr("Project", "المشروع")}>
                <Select name="projectId" defaultValue={initial?.projectId ?? ""}>
                  <option value="">{tr("No project", "لا مشروع")}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label={tr("Conducted by", "مقدم الجلسة")}>
                <Select name="conductedById" defaultValue={initial?.conductedById ?? ""}>
                  <option value="">—</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label={tr("Attendees", "الحضور")}>
                  <Input type="number" min="0" name="attendees" defaultValue={initial?.attendees ?? 0} />
                </Field>
                <Field label={tr("Duration (min)", "المدة (دقيقة)")}>
                  <Input type="number" min="0" name="durationMinutes" defaultValue={initial?.durationMinutes ?? ""} />
                </Field>
              </div>
            </div>
            <Field label={tr("Notes", "ملاحظات")}>
              <Textarea name="notes" defaultValue={initial?.notes ?? ""} rows={3} />
            </Field>
          </FormSection>
          <FormSection title={tr("Photos", "الصور")} description={tr("Optional — attach presentation photos or attendance evidence.", "اختياري — أرفق صور العرض أو دليل الحضور.")}>
            <ImageUploader value={photos} onChange={setPhotos} max={5} hint={tr("JPG, PNG, WebP or GIF up to 8 MB each.", "JPG أو PNG أو WebP أو GIF بحجم يصل إلى 8 ميجابايت لكل صورة.")} />
          </FormSection>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Link href="/tbt" className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground">
            {tr("Cancel", "إلغاء")}
          </Link>
          <Button type="submit" disabled={pending}>
            {mode === "edit" ? tr("Save changes", "حفظ التغييرات") : tr("Record session", "تسجيل الجلسة")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}