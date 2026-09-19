"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { inductions, id } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { fromDateInputValue } from "@/lib/utils";
import { logAudit } from "@/lib/audit";

export type InductionFormState = { error?: string };

function s(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function opt(formData: FormData, key: string) {
  const v = s(formData, key);
  return v ? v : null;
}

function dateOrNull(formData: FormData, key: string) {
  const v = fromDateInputValue(s(formData, key));
  return v && !Number.isNaN(v) ? v : null;
}

function parse(formData: FormData): { error?: string; data?: Record<string, unknown> } {
  const personnelName = s(formData, "personnelName");
  if (!personnelName) return { error: "Personnel name is required." };
  const date = fromDateInputValue(s(formData, "date"));
  if (!date) return { error: "Date is required." };
  return {
    data: {
      projectId: opt(formData, "projectId"),
      personnelName,
      company: opt(formData, "company"),
      idNumber: opt(formData, "idNumber"),
      inductionType: s(formData, "inductionType") || "general",
      date,
      trainer: opt(formData, "trainer"),
      status: s(formData, "status") || "completed",
      expiryDate: dateOrNull(formData, "expiryDate"),
      notes: opt(formData, "notes"),
    },
  };
}

export async function createInduction(_state: InductionFormState, formData: FormData): Promise<InductionFormState> {
  await requirePermission("stats:create");
  const tenant = await getCurrentTenant();
  const parsed = parse(formData);
  if (parsed.error || !parsed.data) return { error: parsed.error };
  const d = parsed.data;

  db.insert(inductions)
    .values({
      id: id("ind"),
      tenantId: tenant.id,
      projectId: (d.projectId as string | null) ?? undefined,
      personnelName: d.personnelName as string,
      company: (d.company as string | null) ?? undefined,
      idNumber: (d.idNumber as string | null) ?? undefined,
      inductionType: d.inductionType as string,
      date: d.date as number,
      trainer: (d.trainer as string | null) ?? undefined,
      status: d.status as string,
      expiryDate: (d.expiryDate as number | null) ?? undefined,
      notes: (d.notes as string | null) ?? undefined,
    })
    .run();

  revalidatePath("/inductions");
  redirect("/inductions");
}

export async function updateInduction(_state: InductionFormState, formData: FormData): Promise<InductionFormState> {
  await requirePermission("stats:edit");
  const tenant = await getCurrentTenant();
  const recordId = s(formData, "id");
  const existing = db.select().from(inductions).where(eq(inductions.id, recordId)).get();
  if (!existing || existing.tenantId !== tenant.id) return { error: "Record not found." };

  const parsed = parse(formData);
  if (parsed.error || !parsed.data) return { error: parsed.error };
  const d = parsed.data;

  db.update(inductions)
    .set({
      projectId: (d.projectId as string | null) ?? undefined,
      personnelName: d.personnelName as string,
      company: (d.company as string | null) ?? undefined,
      idNumber: (d.idNumber as string | null) ?? undefined,
      inductionType: d.inductionType as string,
      date: d.date as number,
      trainer: (d.trainer as string | null) ?? undefined,
      status: d.status as string,
      expiryDate: (d.expiryDate as number | null) ?? undefined,
      notes: (d.notes as string | null) ?? undefined,
    })
    .where(eq(inductions.id, recordId))
    .run();

  revalidatePath("/inductions");
  redirect("/inductions");
}

export async function deleteInduction(formData: FormData) {
  const user = await requirePermission("stats:edit");
  const tenant = await getCurrentTenant();
  const recordId = String(formData.get("id") ?? "");
  const existing = db.select().from(inductions).where(eq(inductions.id, recordId)).get();
  if (!existing || existing.tenantId !== tenant.id) return;
  db.delete(inductions).where(eq(inductions.id, recordId)).run();
  logAudit({
    tenantId: tenant.id,
    actorId: user.id,
    actorName: user.name,
    action: "induction.delete",
    entityType: "induction",
    entityId: recordId,
    details: { personnelName: existing.personnelName },
  });
  revalidatePath("/inductions");
}