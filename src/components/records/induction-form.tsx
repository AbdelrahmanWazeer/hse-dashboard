"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FormError, FormSection } from "@/components/ui/form";
import { useLocale } from "@/components/i18n/locale-provider";
import { INDUCTION_TYPES, INDUCTION_STATUSES } from "@/lib/constants";
import { createInduction, updateInduction, type InductionFormState } from "@/app/(dashboard)/inductions/actions";
import { toDateInputValue } from "@/lib/utils";

export type InductionFormData = {
  id?: string;
  projectId?: string | null;
  personnelName?: string;
  company?: string | null;
  idNumber?: string | null;
  inductionType?: string;
  date?: number;
  trainer?: string | null;
  status?: string;
  expiryDate?: number | null;
  notes?: string | null;
};

export function InductionForm({
  initial,
  projects,
}: {
  initial?: InductionFormData;
  projects: { id: string; name: string }[];
}) {
  const mode = initial?.id ? "edit" : "create";
  const { tr, locale } = useLocale();
  async function submit(state: InductionFormState, fd: FormData): Promise<InductionFormState> {
    return mode === "edit" ? updateInduction(state, fd) : createInduction(state, fd);
  }
  const [state, formAction, pending] = React.useActionState(submit, {});

  return (
    <form action={formAction} className="mx-auto max-w-2xl space-y-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <Card>
        <CardHeader>
          <CardTitle>{mode === "edit" ? tr("Edit induction", "تعديل التأهيل") : tr("New induction", "تهيئة جديدة")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <FormError message={state.error} />
          <FormSection title={tr("Personnel", "الأفراد")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={tr("Personnel name", "اسم الفرد")} required>
                <Input name="personnelName" required defaultValue={initial?.personnelName ?? ""} placeholder={tr("Full name", "الاسم الكامل")} />
              </Field>
              <Field label={tr("Company", "الشركة")}>
                <Input name="company" defaultValue={initial?.company ?? ""} />
              </Field>
              <Field label={tr("ID number", "رقم الهوية")}>
                <Input name="idNumber" defaultValue={initial?.idNumber ?? ""} placeholder={tr("Badge / ID card number", "رقم الشارة / بطاقة الهوية")} />
              </Field>
              <Field label={tr("Project", "المشروع")}>
                <Select name="projectId" defaultValue={initial?.projectId ?? ""}>
                  <option value="">{tr("No project", "بدون مشروع")}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </FormSection>
          <FormSection title={tr("Induction details", "تفاصيل التأهيل")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={tr("Induction type", "نوع التأهيل")} required>
                <Select name="inductionType" required defaultValue={initial?.inductionType ?? "general"}>
                  {INDUCTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{tr(t.label, t.labelAr)}</option>
                  ))}
                </Select>
              </Field>
              <Field label={tr("Status", "الحالة")} required>
                <Select name="status" required defaultValue={initial?.status ?? "completed"}>
                  {INDUCTION_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{tr(s.label, s.labelAr)}</option>
                  ))}
                </Select>
              </Field>
              <Field label={tr("Date", "التاريخ")} required>
                <Input type="date" name="date" required defaultValue={toDateInputValue(initial?.date)} />
              </Field>
              <Field label={tr("Expiry date", "تاريخ الانتهاء")} hint={tr("Certificate or refresher due date", "تاريخ استحقاق الشهادة أو إعادة التأهيل")}>
                <Input type="date" name="expiryDate" defaultValue={toDateInputValue(initial?.expiryDate)} />
              </Field>
              <Field label={tr("Trainer", "المدرّب")}>
                <Input name="trainer" defaultValue={initial?.trainer ?? ""} />
              </Field>
            </div>
            <Field label={tr("Notes", "ملاحظات")}>
              <Textarea name="notes" defaultValue={initial?.notes ?? ""} rows={2} />
            </Field>
          </FormSection>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Link href="/inductions" className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground">
            {tr("Cancel", "إلغاء")}
          </Link>
          <Button type="submit" disabled={pending}>
            {mode === "edit" ? tr("Save changes", "حفظ التغييرات") : tr("Add induction", "إضافة تأهيل")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}