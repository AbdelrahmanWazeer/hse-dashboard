"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tbtRecords, id } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { fromDateInputValue } from "@/lib/utils";
import { logAudit } from "@/lib/audit";

export type TbtFormState = { error?: string };

function s(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function opt(formData: FormData, key: string) {
  const v = s(formData, key);
  return v ? v : null;
}

function numOrNull(formData: FormData, key: string) {
  const v = s(formData, key);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function photos(formData: FormData): string[] {
  const raw = s(formData, "photoUrls");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (u): u is string => typeof u === "string" && (u.startsWith("/") || u.startsWith("http://") || u.startsWith("https://"))
    );
  } catch {
    return [];
  }
}

function parse(formData: FormData): { error?: string; data?: Record<string, unknown> } {
  const title = s(formData, "title");
  if (!title) return { error: "Title is required." };
  const date = fromDateInputValue(s(formData, "date"));
  if (!date) return { error: "Date is required." };
  const attendees = Math.max(0, numOrNull(formData, "attendees") ?? 0);
  const durationMinutes = numOrNull(formData, "durationMinutes");
  return {
    data: {
      title,
      topic: opt(formData, "topic"),
      date,
      projectId: opt(formData, "projectId"),
      conductedById: opt(formData, "conductedById"),
      attendees,
      durationMinutes: durationMinutes !== null ? Math.max(0, durationMinutes) : null,
      notes: opt(formData, "notes"),
      photoUrls: photos(formData),
    },
  };
}

export async function createTbt(_state: TbtFormState, formData: FormData): Promise<TbtFormState> {
  await requirePermission("stats:create");
  const tenant = await getCurrentTenant();
  const parsed = parse(formData);
  if (parsed.error || !parsed.data) return { error: parsed.error };
  const d = parsed.data;

  db.insert(tbtRecords)
    .values({
      id: id("tbt"),
      tenantId: tenant.id,
      projectId: (d.projectId as string | null) ?? undefined,
      title: d.title as string,
      topic: (d.topic as string | null) ?? undefined,
      date: d.date as number,
      conductedBy: (d.conductedById as string | null) ?? undefined,
      attendees: d.attendees as number,
      durationMinutes: (d.durationMinutes as number | null) ?? undefined,
      notes: (d.notes as string | null) ?? undefined,
      photoUrls: d.photoUrls as string[],
    })
    .run();

  revalidatePath("/tbt");
  redirect("/tbt");
}

export async function updateTbt(_state: TbtFormState, formData: FormData): Promise<TbtFormState> {
  await requirePermission("stats:edit");
  const tenant = await getCurrentTenant();
  const recordId = s(formData, "id");
  const existing = db.select().from(tbtRecords).where(eq(tbtRecords.id, recordId)).get();
  if (!existing || existing.tenantId !== tenant.id) return { error: "Record not found." };

  const parsed = parse(formData);
  if (parsed.error || !parsed.data) return { error: parsed.error };
  const d = parsed.data;

  db.update(tbtRecords)
    .set({
      projectId: (d.projectId as string | null) ?? undefined,
      title: d.title as string,
      topic: (d.topic as string | null) ?? undefined,
      date: d.date as number,
      conductedBy: (d.conductedById as string | null) ?? undefined,
      attendees: d.attendees as number,
      durationMinutes: (d.durationMinutes as number | null) ?? undefined,
      notes: (d.notes as string | null) ?? undefined,
      photoUrls: d.photoUrls as string[],
    })
    .where(eq(tbtRecords.id, recordId))
    .run();

  revalidatePath("/tbt");
  redirect("/tbt");
}

export async function deleteTbt(formData: FormData) {
  const user = await requirePermission("stats:edit");
  const tenant = await getCurrentTenant();
  const recordId = String(formData.get("id") ?? "");
  const existing = db.select().from(tbtRecords).where(eq(tbtRecords.id, recordId)).get();
  if (!existing || existing.tenantId !== tenant.id) return;
  db.delete(tbtRecords).where(eq(tbtRecords.id, recordId)).run();
  logAudit({
    tenantId: tenant.id,
    actorId: user.id,
    actorName: user.name,
    action: "tbt.delete",
    entityType: "tbt",
    entityId: recordId,
    details: { title: existing.title },
  });
  revalidatePath("/tbt");
}