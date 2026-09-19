"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Field, FormError } from "@/components/ui/form";
import { ROLE_LABELS } from "@/lib/permissions";
import { acceptInvitation } from "@/app/accept/actions";

export function AcceptInviteForm({
  token,
  name,
  email,
  role,
  jobTitle,
  tenantName,
}: {
  token: string;
  name: string;
  email: string;
  role: string;
  jobTitle: string;
  tenantName: string;
}) {
  const roleLabel = ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role;
  const [state, formAction, pending] = React.useActionState(acceptInvitation, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      <Card className="border-0 shadow-none">
        <CardContent className="space-y-4 p-0">
          <div className="rounded-lg border bg-muted p-3 text-sm">
            <p className="font-medium">
              {tenantName} invites you as <span className="text-primary">{roleLabel}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{jobTitle}</p>
          </div>
          <FormError message={state.error} />
          <Field label="Full name" required>
            <Input name="name" required autoComplete="name" defaultValue={name} />
          </Field>
          <Field label="Email" required hint="This is the email the invitation was sent to.">
            <Input name="email" type="email" readOnly defaultValue={email} className="bg-muted text-muted-foreground" />
          </Field>
          <Field label="Password" required hint="At least 8 characters.">
            <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
          </Field>
          <Field label="Confirm password" required>
            <Input name="confirm" type="password" required minLength={8} autoComplete="new-password" />
          </Field>
        </CardContent>
        <CardFooter className="p-0 pt-4">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating account..." : "Create account & sign in"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}