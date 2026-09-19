"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FormError } from "@/components/ui/form";
import { useLocale } from "@/components/i18n/locale-provider";
import { createManhour, updateManhour, type ManhourFormState } from "@/app/(dashboard)/manhours/actions";
import { toDateInputValue } from "@/lib/utils";

export type ManhourFormData = {
  id?: string;
  projectId?: string | null;
  date?: number;
  manhours?: number;
};

export function ManhourForm({
  initial,
  projects,
}: {
  initial?: ManhourFormData;
  projects: { id: string; name: string }[];
}) {
  const mode = initial?.id ? "edit" : "create";
  const { tr, locale } = useLocale();
  async function submit(state: ManhourFormState, fd: FormData): Promise<ManhourFormState> {
    return mode === "edit" ? updateManhour(state, fd) : createManhour(state, fd);
  }
  const [state, formAction, pending] = React.useActionState(submit, {});

  return (
    <form action={formAction} className="mx-auto max-w-xl space-y-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <Card>
        <CardHeader>
          <CardTitle>{mode === "edit" ? tr("Edit man-hours entry", "تعديل إدخال ساعات العمل") : tr("Add man-hours entry", "إضافة إدخال ساعات العمل")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormError message={state.error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tr("Date", "التاريخ")} required>
              <Input type="date" name="date" required defaultValue={toDateInputValue(initial?.date)} />
            </Field>
            <Field label={tr("Man-hours", "ساعات العمل")} required hint={tr("Total man-hours for the day", "إجمالي ساعات العمل لليوم")}>
              <Input type="number" min="0" step="1" name="manhours" required defaultValue={initial?.manhours ?? ""} />
            </Field>
          </div>
          <Field label={tr("Project", "المشروع")}>
            <Select name="projectId" defaultValue={initial?.projectId ?? ""}>
              <option value="">{tr("No project", "بدون مشروع")}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </Field>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Link href="/manhours" className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground">
            {tr("Cancel", "إلغاء")}
          </Link>
          <Button type="submit" disabled={pending}>
            {mode === "edit" ? tr("Save changes", "حفظ التغييرات") : tr("Add entry", "إضافة إدخال")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}