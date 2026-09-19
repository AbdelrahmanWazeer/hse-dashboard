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
import { FINDING_SEVERITY_META, FINDING_STATUS_META } from "@/lib/constants";
import { FINDING_CATEGORIES, FINDING_SEVERITIES, FINDING_STATUSES } from "@/lib/db/schema";
import { createFinding, updateFinding, type FindingFormState } from "@/app/(dashboard)/findings/actions";
import { humanize, toDateInputValue } from "@/lib/utils";

export type FindingFormData = {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  severity?: string;
  status?: string;
  location?: string | null;
  projectId?: string | null;
  assignedToId?: string | null;
  dueDate?: number | null;
  rootCause?: string | null;
  correctiveAction?: string | null;
  remarks?: string | null;
  photoUrls?: string[];
};

export function FindingForm({
  initial,
  projects,
  teamMembers,
}: {
  initial?: FindingFormData;
  projects: { id: string; name: string }[];
  teamMembers: { id: string; name: string }[];
}) {
  const { tr } = useLocale();
  const mode = initial?.id ? "edit" : "create";
  async function submit(state: FindingFormState, fd: FormData): Promise<FindingFormState> {
    return mode === "edit" ? updateFinding(state, fd) : createFinding(state, fd);
  }
  const [state, formAction, pending] = React.useActionState(submit, {});
  const [photos, setPhotos] = React.useState<string[]>(initial?.photoUrls ?? []);

  return (
    <form action={formAction} className="mx-auto max-w-2xl space-y-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="photoUrls" value={JSON.stringify(photos)} />
      <Card>
        <CardHeader>
          <CardTitle>{mode === "edit" ? tr("Edit finding", "تعديل الملاحظة") : tr("New finding", "ملاحظة جديدة")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormError message={state.error} />
          <Field label={tr("Title", "العنوان")} required>
            <Input name="title" required defaultValue={initial?.title ?? ""} placeholder={tr("e.g. Unguarded grinder on scaffold", "مثال: جلاخة غير محمية على سقالة")} />
          </Field>
          <Field label={tr("Description", "الوصف")} required>
            <Textarea name="description" required defaultValue={initial?.description ?? ""} rows={4} placeholder={tr("Describe the observation / non-conformance", "صف الملاحظة / عدم المطابقة")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={tr("Category", "الفئة")} required>
              <Select name="category" required defaultValue={initial?.category ?? ""}>
                <option value="">{tr("Select…", "اختر…")}</option>
                {FINDING_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{humanize(c)}</option>
                ))}
              </Select>
            </Field>
            <Field label={tr("Severity", "الخطورة")} required>
              <Select name="severity" required defaultValue={initial?.severity ?? ""}>
                <option value="">{tr("Select…", "اختر…")}</option>
                {FINDING_SEVERITIES.map((c) => {
                  const m = FINDING_SEVERITY_META[c];
                  return <option key={c} value={c} className="capitalize">{tr(m?.label ?? c, m?.labelAr ?? m?.label ?? c)}</option>;
                })}
              </Select>
            </Field>
            <Field label={tr("Status", "الحالة")} required>
              <Select name="status" required defaultValue={initial?.status ?? "open"}>
                {FINDING_STATUSES.map((c) => {
                  const m = FINDING_STATUS_META[c];
                  return <option key={c} value={c}>{tr(m?.label ?? humanize(c), m?.labelAr ?? m?.label ?? humanize(c))}</option>;
                })}
              </Select>
            </Field>
          </div>
          <FormSection title={tr("Assignment", "الإسناد")} description={tr("Optional — assign the finding to a project and team member.", "اختياري — أسند الملاحظة إلى مشروع وعضو فريق.")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={tr("Project", "المشروع")}>
                <Select name="projectId" defaultValue={initial?.projectId ?? ""}>
                  <option value="">{tr("No project", "بدون مشروع")}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label={tr("Assigned to", "المسؤول")}>
                <Select name="assignedToId" defaultValue={initial?.assignedToId ?? ""}>
                  <option value="">{tr("Unassigned", "غير مسند")}</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={tr("Location", "الموقع")}>
                <Input name="location" defaultValue={initial?.location ?? ""} placeholder={tr("Area, floor, equipment ID", "المنطقة، الطابق، معرّف المعدة")} />
              </Field>
              <Field label={tr("Due date", "تاريخ الاستحقاق")}>
                <Input type="date" name="dueDate" defaultValue={toDateInputValue(initial?.dueDate)} />
              </Field>
            </div>
          </FormSection>
          <FormSection title={tr("Photos & evidence", "الصور والأدلة")} description={tr("Optional — attach photos of the observation or site evidence.", "اختياري — أرفق صورًا للملاحظة أو أدلة من الموقع.")}>
            <ImageUploader
              value={photos}
              onChange={setPhotos}
              max={5}
              hint={tr("JPG, PNG, WebP or GIF up to 8 MB each.", "JPG أو PNG أو WebP أو GIF حتى 8 ميجابايت لكل صورة.")}
            />
          </FormSection>
          <FormSection title={tr("Resolution", "المعالجة")} description={tr("Optional — capture root cause and corrective action.", "اختياري — سجّل السبب الجذري والإجراء التصحيحي.")}>
            <Field label={tr("Root cause", "السبب الجذري")}>
              <Textarea name="rootCause" defaultValue={initial?.rootCause ?? ""} rows={2} />
            </Field>
            <Field label={tr("Corrective action", "إجراء تصحيحي")}>
              <Textarea name="correctiveAction" defaultValue={initial?.correctiveAction ?? ""} rows={2} />
            </Field>
          </FormSection>
          <Field label={tr("Remarks", "ملاحظات")}>
            <Textarea name="remarks" defaultValue={initial?.remarks ?? ""} rows={2} />
          </Field>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Link href="/findings" className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground">
            {tr("Cancel", "إلغاء")}
          </Link>
          <Button type="submit" disabled={pending}>
            {mode === "edit" ? tr("Save changes", "حفظ التغييرات") : tr("Create finding", "إنشاء ملاحظة")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}