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
import { PROJECT_STATUS_META } from "@/lib/constants";
import { createProject, type ProjectFormState } from "@/app/(dashboard)/projects/actions";

export type ProjectFormData = {
  name?: string;
  code?: string | null;
  description?: string | null;
  location?: string | null;
  status?: string;
  startDate?: string;
  endDate?: string;
  hseManagerId?: string | null;
};

export function ProjectForm({
  teamMembers,
}: {
  teamMembers: { id: string; name: string; jobTitle: string }[];
}) {
  const { tr } = useLocale();
  const [state, formAction, pending] = React.useActionState(createProject, {});

  return (
    <form action={formAction} className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{tr("New project", "مشروع جديد")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <FormError message={state.error} />
          <FormSection title={tr("Project details", "تفاصيل المشروع")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={tr("Project name", "اسم المشروع")} required>
                <Input name="name" required placeholder={tr("e.g. Tower B — Marine Works", "مثال: Tower B — Marine Works")} />
              </Field>
              <Field label={tr("Code", "الرمز")}>
                <Input name="code" placeholder={tr("e.g. PRJ-026", "مثال: PRJ-026")} />
              </Field>
            </div>
            <Field label={tr("Description", "الوصف")}>
              <Textarea name="description" rows={3} placeholder={tr("Brief scope of the project", "نبذة عن نطاق المشروع")} />
            </Field>
            <Field label={tr("Location", "الموقع")}>
              <Input name="location" placeholder={tr("e.g. Plot R3, Khalifa Industrial Zone", "مثال: Plot R3, Khalifa Industrial Zone")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={tr("Status", "الحالة")}>
                <Select name="status" defaultValue="active">
                  <option value="active">{tr(PROJECT_STATUS_META.active.label, PROJECT_STATUS_META.active.labelAr)}</option>
                  <option value="on_hold">{tr(PROJECT_STATUS_META.on_hold.label, PROJECT_STATUS_META.on_hold.labelAr)}</option>
                  <option value="completed">{tr(PROJECT_STATUS_META.completed.label, PROJECT_STATUS_META.completed.labelAr)}</option>
                </Select>
              </Field>
              <Field label={tr("Start date", "تاريخ البداية")}>
                <Input type="date" name="startDate" />
              </Field>
              <Field label={tr("End date", "تاريخ النهاية")}>
                <Input type="date" name="endDate" />
              </Field>
            </div>
            <Field label={tr("HSE manager", "مدير السلامة")}>
              <Select name="hseManagerId" defaultValue="">
                <option value="">{tr("Not assigned", "غير معين")}</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.jobTitle}
                  </option>
                ))}
              </Select>
            </Field>
          </FormSection>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Link
            href="/projects"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            Cancel
          </Link>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create project"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}