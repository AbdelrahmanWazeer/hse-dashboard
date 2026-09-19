"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { manhours, id } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { fromDateInputValue } from "@/lib/utils";
import { logAudit } from "@/lib/audit";

export type ManhourFormState = { error?: string };

function s(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function opt(formData: FormData, key: string) {
  const v = s(formData, key);
  return v ? v : null;
}

function parse(formData: FormData): { error?: string; data?: { projectId: string | null; date: number; manhours: number } } {
  const date = fromDateInputValue(s(formData, "date"));
  if (!date) return { error: "Date is required." };
  const raw = Number(s(formData, "manhours"));
  if (!Number.isFinite(raw) || raw < 0) return { error: "Man-hours must be a positive number." };
  return {
    data: {
      projectId: opt(formData, "projectId"),
      date,
      manhours: Math.round(raw),
    },
  };
}

export async function createManhour(_state: ManhourFormState, formData: FormData): Promise<ManhourFormState> {
  await requirePermission("stats:create");
  const tenant = await getCurrentTenant();
  const parsed = parse(formData);
  if (parsed.error || !parsed.data) return { error: parsed.error };
  const d = parsed.data;

  db.insert(manhours)
    .values({
      id: id("mh"),
      tenantId: tenant.id,
      projectId: d.projectId ?? undefined,
      date: d.date,
      manhours: d.manhours,
    })
    .run();

  revalidatePath("/manhours");
  redirect("/manhours");
}

export async function updateManhour(_state: ManhourFormState, formData: FormData): Promise<ManhourFormState> {
  await requirePermission("stats:edit");
  const tenant = await getCurrentTenant();
  const recordId = s(formData, "id");
  const existing = db.select().from(manhours).where(eq(manhours.id, recordId)).get();
  if (!existing || existing.tenantId !== tenant.id) return { error: "Record not found." };

  const parsed = parse(formData);
  if (parsed.error || !parsed.data) return { error: parsed.error };
  const d = parsed.data;

  db.update(manhours)
    .set({
      projectId: d.projectId ?? undefined,
      date: d.date,
      manhours: d.manhours,
    })
    .where(eq(manhours.id, recordId))
    .run();

  revalidatePath("/manhours");
  redirect("/manhours");
}

export async function deleteManhour(formData: FormData) {
  const user = await requirePermission("stats:edit");
  const tenant = await getCurrentTenant();
  const recordId = String(formData.get("id") ?? "");
  const existing = db.select().from(manhours).where(eq(manhours.id, recordId)).get();
  if (!existing || existing.tenantId !== tenant.id) return;
  db.delete(manhours).where(eq(manhours.id, recordId)).run();
  logAudit({
    tenantId: tenant.id,
    actorId: user.id,
    actorName: user.name,
    action: "manhour.delete",
    entityType: "manhour",
    entityId: recordId,
    details: { date: existing.date, manhours: existing.manhours },
  });
  revalidatePath("/manhours");
}