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
import { PPE_CATEGORIES } from "@/lib/constants";
import { useLocale } from "@/components/i18n/locale-provider";
import { createPpeItem, updatePpeItem, type PpeItemFormState } from "@/app/(dashboard)/inventory/actions";

export type PpeItemFormData = {
  id?: string;
  name?: string;
  category?: string;
  size?: string | null;
  brand?: string | null;
  description?: string | null;
  totalStock?: number;
  safetyStock?: number;
  unit?: string | null;
  storageLocation?: string | null;
  pricePerUnit?: number | null;
  minReorderLevel?: number;
  photoUrl?: string | null;
};

const categoryLabel = (c: string) => c.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

export function PpeItemForm({
  initial,
  isEdit,
}: {
  initial?: PpeItemFormData;
  isEdit?: boolean;
}) {
  const { tr } = useLocale();
  async function submit(state: PpeItemFormState, fd: FormData): Promise<PpeItemFormState> {
    return isEdit ? updatePpeItem(state, fd) : createPpeItem(state, fd);
  }
  const [state, formAction, pending] = React.useActionState(submit, {});
  const [photo, setPhoto] = React.useState(initial?.photoUrl ?? "");

  return (
    <form action={formAction} className="mx-auto max-w-2xl space-y-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? tr("Edit PPE item", "تعديل عنصر معدات الوقاية") : tr("Add PPE item", "إضافة عنصر معدات الوقاية")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormError message={state.error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tr("Name", "الاسم")} required>
              <Input name="name" required defaultValue={initial?.name ?? ""} placeholder={tr("e.g. Safety Helmet", "مثال: خوذة أمان")} />
            </Field>
            <Field label={tr("Category", "الفئة")} required>
              <Select name="category" required defaultValue={initial?.category ?? ""}>
                <option value="">{tr("Select…", "اختر…")}</option>
                {PPE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{categoryLabel(c)}</option>
                ))}
              </Select>
            </Field>
            <Field label={tr("Size", "المقاس")}>
              <Input name="size" defaultValue={initial?.size ?? ""} placeholder={tr("e.g. One size / L / XL", "مثال: مقاس واحد / L / XL")} />
            </Field>
            <Field label={tr("Brand", "العلامة التجارية")}>
              <Input name="brand" defaultValue={initial?.brand ?? ""} />
            </Field>
            <Field label={tr("Unit", "الوحدة")}>
              <Input name="unit" defaultValue={initial?.unit ?? "pcs"} />
            </Field>
            <Field label={tr("Storage location", "موقع التخزين")}>
              <Input name="storageLocation" defaultValue={initial?.storageLocation ?? ""} placeholder={tr("e.g. Warehouse A, Rack 3", "مثال: المستودع أ، رف 3")} />
            </Field>
            <Field label={tr("Price per unit ($)", "السعر للوحدة ($)")}>
              <Input type="number" min="0" step="0.01" name="pricePerUnit" defaultValue={initial?.pricePerUnit ?? ""} />
            </Field>
            <Field label={tr("Description", "الوصف")}>
              <Textarea name="description" defaultValue={initial?.description ?? ""} rows={2} />
            </Field>
            <Field label={tr("Item photo", "صورة الصنف")} hint={tr("Product / reference photo shown in inventory (optional)", "صورة المنتج / الصورة المرجعية المعروضة في المخزون (اختياري)")}>
              <ImageUploader value={photo ? [photo] : []} max={1} onChange={(urls) => setPhoto(urls[0] ?? "")} />
              <Input
                name="photoUrl"
                value={photo}
                onChange={(e) => setPhoto(e.target.value)}
                placeholder={tr("…or paste an image URL (https://…)", "…أو الصق رابط صورة (https://…)")}
                type="url"
                className="mt-2"
              />
            </Field>
          </div>
          <FormSection title={tr("Stock levels", "مستويات المخزون")}>
            <div className="grid gap-4 sm:grid-cols-3">
              {!isEdit && (
                <Field label={tr("Initial stock", "المخزون الابتدائي")} hint={tr("Starting units on hand", "الوحدات المتوفرة في البداية")} required={false}>
                  <Input type="number" min="0" name="totalStock" defaultValue={initial?.totalStock ?? 0} />
                </Field>
              )}
              <Field label={tr("Safety stock", "مخزون الأمان")}>
                <Input type="number" min="0" name="safetyStock" defaultValue={initial?.safetyStock ?? 0} />
              </Field>
              <Field label={tr("Reorder level", "حد إعادة الطلب")}>
                <Input type="number" min="0" name="minReorderLevel" defaultValue={initial?.minReorderLevel ?? 5} />
              </Field>
            </div>
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                {tr("Stock quantities (total / issued / available) are changed through transactions, not here.", "يتم تغيير كميات المخزون (الإجمالي / المصروف / المتاح) عبر المعاملات، وليس هنا.")}
              </p>
            )}
          </FormSection>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Link href="/inventory" className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground">
            {tr("Cancel", "إلغاء")}
          </Link>
          <Button type="submit" disabled={pending}>
            {isEdit ? tr("Save changes", "حفظ التغييرات") : tr("Add item", "إضافة عنصر")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}