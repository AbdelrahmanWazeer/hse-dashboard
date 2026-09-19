"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FormError } from "@/components/ui/form";
import { useLocale } from "@/components/i18n/locale-provider";
import { createPpeTransaction, type PpeTxnFormState } from "@/app/(dashboard)/inventory/actions";
import { toDateInputValue } from "@/lib/utils";

const TXN_LABELS: Record<string, string> = {
  receive: "Receive (stock in)",
  issue: "Issue (stock out)",
  return: "Return",
  damage: "Damage / write-off",
  adjust: "Adjust balance",
};

const TXN_LABELS_AR: Record<string, string> = {
  receive: "استلام (إدخال للمخزون)",
  issue: "صرف (إخراج من المخزون)",
  return: "إرجاع",
  damage: "تالف / شطب",
  adjust: "تعديل الرصيد",
};

const DEFAULT_DATE = toDateInputValue(Date.now());

export function PpeTransactionForm({
  items,
  teamMembers,
  defaultItemId,
}: {
  items: { id: string; name: string; available: number }[];
  teamMembers: { id: string; name: string }[];
  defaultItemId?: string;
}) {
  const { tr } = useLocale();
  const [selected, setSelected] = React.useState(defaultItemId ?? "");
  async function submit(state: PpeTxnFormState, fd: FormData): Promise<PpeTxnFormState> {
    return createPpeTransaction(state, fd);
  }
  const [state, formAction, pending] = React.useActionState(submit, {});

  const available = items.find((i) => i.id === selected)?.available ?? 0;

  return (
    <form action={formAction} className="mx-auto max-w-xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{tr("New transaction", "معاملة جديدة")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormError message={state.error} />
          <Field label={tr("Item", "العنصر")} required>
            <Select name="ppeItemId" required value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">{tr("Select…", "اختر…")}</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>{i.name} ({i.available} {tr("available", "متاح")})</option>
              ))}
            </Select>
          </Field>
          <Field label={tr("Type", "النوع")} required>
            <Select name="type" required defaultValue="issue">
              {Object.entries(TXN_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{tr(l, TXN_LABELS_AR[v] ?? l)}</option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tr("Quantity", "الكمية")} required hint={selected ? `${available} ${tr("currently available", "متاح حاليًا")}` : undefined}>
              <Input type="number" min="0" name="quantity" required defaultValue="1" />
            </Field>
            <Field label={tr("Date", "التاريخ")} required>
              <Input type="date" name="date" required defaultValue={DEFAULT_DATE} />
            </Field>
          </div>
          <Field label={tr("Issued to (team member)", "صُرف إلى (أحد أعضاء الفريق)")}>
            <Select name="teamMemberId" defaultValue="">
              <option value="">—</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </Select>
          </Field>
          <Field label={tr("Note", "ملاحظة")}>
            <Textarea name="note" defaultValue="" rows={2} placeholder={tr("e.g. Issued to scaffolding crew #2", "مثال: صُرف لطاقم السقالات رقم 2")} />
          </Field>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Link href="/inventory" className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground">
            {tr("Cancel", "إلغاء")}
          </Link>
          <Button type="submit" disabled={pending}>{tr("Save transaction", "حفظ المعاملة")}</Button>
        </CardFooter>
      </Card>
    </form>
  );
}