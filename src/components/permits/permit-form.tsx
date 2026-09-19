"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FormError, FormSection } from "@/components/ui/form";
import { PERMIT_TYPES, PERMIT_STATUSES } from "@/lib/db/schema";
import { PERMIT_TYPE_LABELS, PERMIT_TYPE_LABELS_AR, PERMIT_STATUS_META } from "@/lib/constants";
import { useLocale } from "@/components/i18n/locale-provider";
import { createPermit, updatePermit, type PermitFormState } from "@/app/(dashboard)/permits/actions";
import { toDateInputValue } from "@/lib/utils";

export type PermitFormData = {
  id?: string;
  projectId?: string | null;
  permitType?: string;
  title?: string;
  description?: string | null;
  location?: string | null;
  locationX?: number | null;
  locationY?: number | null;
  startDate?: number;
  endDate?: number;
  status?: string;
  assignedTo?: string | null;
  ppeRequired?: string[];
  hazards?: string[];
  controls?: string[];
  isolation?: string | null;
  remarks?: string | null;
};

export function PermitForm({
  initial,
  projects,
  teamMembers,
}: {
  initial?: PermitFormData;
  projects: { id: string; name: string }[];
  teamMembers: { id: string; name: string }[];
}) {
  const mode = initial?.id ? "edit" : "create";
  const { tr } = useLocale();
  async function submit(state: PermitFormState, fd: FormData): Promise<PermitFormState> {
    return mode === "edit" ? updatePermit(state, fd) : createPermit(state, fd);
  }
  const [state, formAction, pending] = React.useActionState(submit, {});

  return (
    <form action={formAction} className="mx-auto max-w-2xl space-y-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <Card>
        <CardHeader>
          <CardTitle>{mode === "edit" ? tr("Edit permit", "تعديل التصريح") : tr("New work permit", "تصريح عمل جديد")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <FormError message={state.error} />
          <FormSection title={tr("Permit details", "تفاصيل التصريح")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={tr("Permit type", "نوع التصريح")} required>
                <Select name="permitType" required defaultValue={initial?.permitType ?? ""}>
                  <option value="">{tr("Select…", "اختر…")}</option>
                  {PERMIT_TYPES.map((t) => (
                    <option key={t} value={t}>{tr(PERMIT_TYPE_LABELS[t] ?? t, PERMIT_TYPE_LABELS_AR[t] ?? PERMIT_TYPE_LABELS[t] ?? t)}</option>
                  ))}
                </Select>
              </Field>
              <Field label={tr("Status", "الحالة")} required>
                <Select name="status" required defaultValue={initial?.status ?? "pending"}>
                  {PERMIT_STATUSES.map((s) => (
                    <option key={s} value={s}>{tr(PERMIT_STATUS_META[s]?.label ?? s, PERMIT_STATUS_META[s]?.labelAr ?? PERMIT_STATUS_META[s]?.label ?? s)}</option>
                  ))}
                </Select>
              </Field>
              <Field label={tr("Title", "العنوان")} required className="sm:col-span-2">
                <Input name="title" required defaultValue={initial?.title ?? ""} placeholder={tr("e.g. Grinding works at feed hopper", "مثال: أعمال طحن عند قادوس التغذية")} />
              </Field>
              <Field label={tr("Project", "المشروع")}>
                <Select name="projectId" defaultValue={initial?.projectId ?? ""}>
                  <option value="">{tr("No project", "بدون مشروع")}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label={tr("Assigned to (permit holder / crew)", "مُسند إلى (حامل التصريح / طاقم العمل)")}>
                <Select name="assignedTo" defaultValue={initial?.assignedTo ?? ""}>
                  <option value="">{tr("Unassigned", "غير مُسند")}</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label={tr("Location", "الموقع")}>
                <Input name="location" defaultValue={initial?.location ?? ""} placeholder={tr("e.g. Crusher 2, feed area", "مثال: كسارة 2، منطقة التغذية")} />
              </Field>
              <Field label={tr("Description", "الوصف")}>
                <Textarea name="description" defaultValue={initial?.description ?? ""} rows={3} />
              </Field>
            </div>
          </FormSection>

          <FormSection title={tr("Schedule", "الجدول الزمني")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={tr("Start date", "تاريخ البداية")} required>
                <Input type="date" name="startDate" required defaultValue={toDateInputValue(initial?.startDate)} />
              </Field>
              <Field label={tr("End date", "تاريخ النهاية")} required>
                <Input type="date" name="endDate" required defaultValue={toDateInputValue(initial?.endDate)} />
              </Field>
            </div>
          </FormSection>

          <FormSection
            title={tr("Map position", "الموقع على الخريطة")}
            description={tr("Optional — percentage coordinates (0–100) so the permit shows on the site map.", "اختياري — إحداثيات بنسبة مئوية (0–100) ليظهر التصريح على خريطة الموقع.")}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="X (%)">
                <Input type="number" min="0" max="100" step="0.1" name="locationX" defaultValue={initial?.locationX ?? ""} />
              </Field>
              <Field label="Y (%)">
                <Input type="number" min="0" max="100" step="0.1" name="locationY" defaultValue={initial?.locationY ?? ""} />
              </Field>
            </div>
          </FormSection>

          <FormSection title={tr("Controls & PPE", "إجراءات التحكم ومعدات الوقاية")}>
            <Field
              label={tr("Required PPE", "معدات الوقاية الشخصية المطلوبة")}
              hint={tr("Comma-separated, e.g. Helmet, Safety Gloves, Goggles", "مفصولة بفواصل، مثال: خوذة، قفازات سلامة، نظارات واقية")}
              required={false}
            >
              <Input name="ppeRequired" defaultValue={(initial?.ppeRequired ?? []).join(", ")} />
            </Field>
            <Field label={tr("Hazards", "المخاطر")} hint={tr("One per line", "واحد في كل سطر")} required={false}>
              <Textarea name="hazards" defaultValue={(initial?.hazards ?? []).join("\n")} rows={3} placeholder={tr("Fire risk\nFalling objects", "خطر الحريق\nسقوط الأجسام")} />
            </Field>
            <Field label={tr("Control measures", "إجراءات التحكم")} hint={tr("One per line", "واحد في كل سطر")} required={false}>
              <Textarea name="controls" defaultValue={(initial?.controls ?? []).join("\n")} rows={3} />
            </Field>
            <Field label={tr("Isolation", "العزل")}>
              <Input name="isolation" defaultValue={initial?.isolation ?? ""} placeholder={tr("e.g. LOTO, lock #12", "مثال: قفل وتعليق (LOTO)، قفل رقم 12")} />
            </Field>
            <Field label={tr("Remarks", "ملاحظات")}>
              <Textarea name="remarks" defaultValue={initial?.remarks ?? ""} rows={2} />
            </Field>
          </FormSection>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Link href="/permits" className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground">
            {tr("Cancel", "إلغاء")}
          </Link>
          <Button type="submit" disabled={pending}>
            {mode === "edit" ? tr("Save changes", "حفظ التغييرات") : tr("Create permit", "إنشاء التصريح")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}