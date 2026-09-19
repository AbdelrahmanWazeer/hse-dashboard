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
import { INCIDENT_TYPES } from "@/lib/db/schema";
import { INCIDENT_TYPE_META } from "@/lib/constants";
import { useLocale } from "@/components/i18n/locale-provider";
import { createIncident, updateIncident, type IncidentFormState } from "@/app/(dashboard)/incidents/actions";
import { toDateInputValue } from "@/lib/utils";

export type IncidentFormData = {
  id?: string;
  projectId?: string | null;
  incidentType?: string;
  date?: number;
  time?: string | null;
  location?: string | null;
  description?: string;
  personName?: string | null;
  personCompany?: string | null;
  jobTitle?: string | null;
  age?: number | null;
  gender?: string | null;
  bodyPart?: string | null;
  natureOfInjury?: string | null;
  cause?: string | null;
  immediateAction?: string | null;
  investigation?: string | null;
  rootCause?: string | null;
  correctiveActions?: string | null;
  lostDays?: number | null;
  restrictedDays?: number | null;
  medicalTreatmentCost?: number | null;
  propertyDamageCost?: number | null;
  status?: string;
  photoUrls?: string[];
};

export function IncidentForm({
  initial,
  projects,
}: {
  initial?: IncidentFormData;
  projects: { id: string; name: string }[];
}) {
  const { tr } = useLocale();
  const mode = initial?.id ? "edit" : "create";
  async function submit(state: IncidentFormState, fd: FormData): Promise<IncidentFormState> {
    return mode === "edit" ? updateIncident(state, fd) : createIncident(state, fd);
  }
  const [state, formAction, pending] = React.useActionState(submit, {});
  const [photos, setPhotos] = React.useState<string[]>(initial?.photoUrls ?? []);

  return (
    <form action={formAction} className="mx-auto max-w-3xl space-y-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="photoUrls" value={JSON.stringify(photos)} />
      <Card>
        <CardHeader>
          <CardTitle>{mode === "edit" ? tr("Edit incident", "تعديل الحادثة") : tr("Log incident", "تسجيل حادثة")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <FormError message={state.error} />
          <FormSection title={tr("Overview", "نظرة عامة")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={tr("Incident type", "نوع الحادثة")} required>
                <Select name="incidentType" required defaultValue={initial?.incidentType ?? ""}>
                  <option value="">{tr("Select…", "اختر...")}</option>
                  {INCIDENT_TYPES.map((t) => (
                    <option key={t} value={t}>{tr(INCIDENT_TYPE_META[t]?.label ?? t, INCIDENT_TYPE_META[t]?.labelAr ?? INCIDENT_TYPE_META[t]?.label ?? t)}</option>
                  ))}
                </Select>
              </Field>
              <Field label={tr("Status", "الحالة")} required>
                <Select name="status" required defaultValue={initial?.status ?? "reported"}>
                  <option value="reported">{tr("Reported", "أُبلغ عنها")}</option>
                  <option value="investigating">{tr("Under investigation", "قيد التحقيق")}</option>
                  <option value="closed">{tr("Closed", "مغلقة")}</option>
                </Select>
              </Field>
              <Field label={tr("Date", "التاريخ")} required>
                <Input type="date" name="date" required defaultValue={toDateInputValue(initial?.date)} />
              </Field>
              <Field label={tr("Time", "الوقت")}>
                <Input type="time" name="time" defaultValue={initial?.time ?? ""} />
              </Field>
              <Field label={tr("Project", "المشروع")}>
                <Select name="projectId" defaultValue={initial?.projectId ?? ""}>
                  <option value="">{tr("No project", "بدون مشروع")}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label={tr("Location", "الموقع")} hint={tr("Area or equipment where the event occurred", "المنطقة أو المعدات التي وقع فيها الحدث")}>
                <Input name="location" defaultValue={initial?.location ?? ""} placeholder={tr("e.g. Crushing plant, feed hopper area", "مثال: مصنع التكسير، منطقة قادوس التغذية")} />
              </Field>
            </div>
            <Field label={tr("Description", "الوصف")} required>
              <Textarea name="description" required defaultValue={initial?.description ?? ""} rows={3} placeholder={tr("What happened?", "ماذا حدث؟")} />
            </Field>
          </FormSection>

<FormSection title={tr("Person involved", "الشخص المعني")} description={tr("Optional — required for injury incidents.", "اختياري — مطلوب لحوادث الإصابات.")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={tr("Name", "الاسم")}>
                <Input name="personName" defaultValue={initial?.personName ?? ""} />
              </Field>
              <Field label={tr("Company", "الشركة")}>
                <Input name="personCompany" defaultValue={initial?.personCompany ?? ""} />
              </Field>
              <Field label={tr("Job title", "المسمى الوظيفي")}>
                <Input name="jobTitle" defaultValue={initial?.jobTitle ?? ""} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label={tr("Age", "العمر")}>
                  <Input type="number" min="1" max="120" name="age" defaultValue={initial?.age ?? ""} />
                </Field>
                <Field label={tr("Gender", "الجنس")}>
                  <Select name="gender" defaultValue={initial?.gender ?? ""}>
                    <option value="">—</option>
                    <option value="male">{tr("Male", "ذكر")}</option>
                    <option value="female">{tr("Female", "أنثى")}</option>
                  </Select>
                </Field>
              </div>
              <Field label={tr("Body part", "جزء الجسم")} hint={tr("e.g. right hand / lower back", "مثال: اليد اليمنى / أسفل الظهر")}>
                <Input name="bodyPart" defaultValue={initial?.bodyPart ?? ""} />
              </Field>
              <Field label={tr("Nature of injury", "طبيعة الإصابة")} hint={tr("e.g. fracture, laceration, burn", "مثال: كسر، تمزق، حرق")}>
                <Input name="natureOfInjury" defaultValue={initial?.natureOfInjury ?? ""} />
              </Field>
              <Field label={tr("Lost days", "أيام العمل المفقودة")} hint={tr("Auto-flags as LTI when > 0", "يُعلَّم تلقائيًا كإصابة بفقدان وقت (LTI) عندما يكون أكبر من 0")} required={false}>
                <Input type="number" min="0" name="lostDays" defaultValue={initial?.lostDays ?? 0} />
              </Field>
              <Field label={tr("Restricted work days", "أيام العمل المقيد")}>
                <Input type="number" min="0" name="restrictedDays" defaultValue={initial?.restrictedDays ?? 0} />
              </Field>
              <Field label={tr("Medical treatment cost ($)", "تكلفة العلاج الطبي ($)")}>
                <Input type="number" min="0" step="0.01" name="medicalTreatmentCost" defaultValue={initial?.medicalTreatmentCost ?? ""} />
              </Field>
              <Field label={tr("Property damage cost ($)", "تكلفة أضرار الممتلكات ($)")}>
                <Input type="number" min="0" step="0.01" name="propertyDamageCost" defaultValue={initial?.propertyDamageCost ?? ""} />
              </Field>
            </div>
          </FormSection>

          <FormSection title={tr("Photos & evidence", "الصور والأدلة")} description={tr("Optional — attach incident photos or damage evidence.", "اختياري — ارفق صور الحادثة أو أدلة الأضرار.")}>
            <ImageUploader
              value={photos}
              onChange={setPhotos}
              max={5}
              hint={tr("JPG, PNG, WebP or GIF up to 8 MB each.", "JPG أو PNG أو WebP أو GIF بحجم يصل إلى 8 ميجابايت لكل ملف.")}
            />
          </FormSection>

          <FormSection title={tr("Causes & response", "الأسباب والاستجابة")}>
            <Field label={tr("Cause", "السبب")} hint={tr("Direct cause(s) of the event", "السبب (الأسباب) المباشر للحدث")}>
              <Textarea name="cause" defaultValue={initial?.cause ?? ""} rows={2} />
            </Field>
            <Field label={tr("Immediate action taken", "الإجراء الفوري المتخذ")}>
              <Textarea name="immediateAction" defaultValue={initial?.immediateAction ?? ""} rows={2} placeholder={tr("First aid, isolation, barricading…", "إسعافات أولية، عزل، إقامة حواجز…")} />
            </Field>
            <Field label={tr("Investigation notes", "ملاحظات التحقيق")}>
              <Textarea name="investigation" defaultValue={initial?.investigation ?? ""} rows={3} />
            </Field>
            <Field label={tr("Root cause", "السبب الجذري")}>
              <Textarea name="rootCause" defaultValue={initial?.rootCause ?? ""} rows={2} />
            </Field>
            <Field label={tr("Corrective actions", "الإجراءات التصحيحية")}>
              <Textarea name="correctiveActions" defaultValue={initial?.correctiveActions ?? ""} rows={2} />
            </Field>
          </FormSection>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Link href="/incidents" className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground">
            {tr("Cancel", "إلغاء")}
          </Link>
          <Button type="submit" disabled={pending}>
            {mode === "edit" ? tr("Save changes", "حفظ التغييرات") : tr("Log incident", "تسجيل حادثة")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}