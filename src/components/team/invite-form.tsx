"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, FormError } from "@/components/ui/form";
import { useLocale } from "@/components/i18n/locale-provider";
import { ROLES, JOB_TITLES } from "@/lib/constants";
import { createInvitation, type InviteFormState } from "@/app/(dashboard)/team/actions";
import { CopyButton } from "@/components/team/copy-button";

export function InviteForm() {
  const { tr } = useLocale();
  async function submit(_state: InviteFormState, fd: FormData): Promise<InviteFormState> {
    return createInvitation(_state, fd);
  }
  const [state, formAction, pending] = React.useActionState(submit, {});

  return (
    <form action={formAction} className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{tr("Invite a team member", "دعوة عضو في الفريق")}</CardTitle>
          <CardDescription>
            {tr("They will receive an email with a secure link to create their account and join this workspace.", "سيتلقى بريدًا إلكترونيًا يحتوي على رابط آمن لإنشاء حسابه والانضمام إلى هذه المساحة.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormError message={state.error} />
          {state.ok && (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
              {state.ok}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tr("Full name", "الاسم الكامل")} required>
              <Input name="name" required placeholder={tr("e.g. Sara Ahmed", "مثال: Sara Ahmed")} />
            </Field>
            <Field label={tr("Email", "البريد الإلكتروني")} required>
              <Input name="email" type="email" required placeholder="colleague@company.com" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tr("Role", "الدور")} required hint={tr("Determines what they can access and do.", "يحدد ما يمكن الوصول إليه وما يمكنه فعله.")}>
              <Select name="role" required defaultValue="editor">
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {tr(r.label, r.labelAr)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={tr("Job title", "المسمى الوظيفي")} required>
              <Input name="jobTitle" required list="job-titles" placeholder={tr("e.g. HSE Team Leader", "مثال: HSE Team Leader")} />
              <datalist id="job-titles">
                {JOB_TITLES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </Field>
          </div>
          {state.inviteUrl && (
            <div className="rounded-md border bg-muted p-3">
              <p className="text-xs font-medium text-muted-foreground">{tr("Manual invite link (email not sent):", "رابط الدعوة اليدوي (لم يتم إرسال البريد الإلكتروني):")}</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs">
                  {state.inviteUrl}
                </code>
                <CopyButton value={state.inviteUrl} />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Link
            href="/team"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            {tr("Cancel", "إلغاء")}
          </Link>
          <Button type="submit" disabled={pending}>
            {tr("Send invitation", "إرسال الدعوة")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}