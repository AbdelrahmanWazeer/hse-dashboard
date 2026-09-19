"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { workPermits, id, PERMIT_TYPES, PERMIT_STATUSES } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { fromDateInputValue } from "@/lib/utils";

export type PermitFormState = { error?: string };

function s(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function opt(formData: FormData, key: string) {
  const v = s(formData, key);
  return v ? v : null;
}

function listFromText(value: string) {
  return value
    .split(/[\n,;]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function numOrNull(formData: FormData, key: string) {
  const v = s(formData, key);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function nextPermitNo(tenantId: string) {
  const rows = db.select().from(workPermits).where(eq(workPermits.tenantId, tenantId)).all();
  const year = new Date().getFullYear();
  const maxSeq = rows.reduce((m, p) => {
    const m2 = p.permitNo.match(/WPR-\d{4}-(\d+)/);
    const seq = m2 ? Number(m2[1]) : 0;
    return Math.max(m, seq);
  }, 0);
  return `WPR-${year}-${String(maxSeq + 1).padStart(4, "0")}`;
}

function parseCommon(formData: FormData) {
  const permitType = s(formData, "permitType");
  const title = s(formData, "title");
  const status = s(formData, "status");
  const startDate = fromDateInputValue(String(formData.get("startDate") ?? ""));
  const endDate = fromDateInputValue(String(formData.get("endDate") ?? ""));
  return {
    permitType,
    title,
    status,
    startDate,
    endDate,
    description: opt(formData, "description"),
    location: opt(formData, "location"),
    locationX: numOrNull(formData, "locationX"),
    locationY: numOrNull(formData, "locationY"),
    projectId: opt(formData, "projectId"),
    assignedTo: opt(formData, "assignedTo") || undefined,
    ppeRequired: listFromText(s(formData, "ppeRequired")),
    hazards: listFromText(s(formData, "hazards")),
    controls: listFromText(s(formData, "controls")),
    isolation: opt(formData, "isolation"),
    remarks: opt(formData, "remarks"),
  };
}

export async function createPermit(_state: PermitFormState, formData: FormData) {
  await requirePermission("permits:create");
  const tenant = await getCurrentTenant();

  const v = parseCommon(formData);
  if (!v.permitType || !v.title || !v.startDate || !v.endDate) {
    return { error: "Permit type, title, start date, and end date are required." };
  }
  if (!PERMIT_TYPES.includes(v.permitType as never)) return { error: "Please choose a permit type." };
  if (!PERMIT_STATUSES.includes(v.status as never)) return { error: "Please choose a status." };

  const now = Date.now();
  const permitId = id("wpr");
  db.insert(workPermits)
    .values({
      id: permitId,
      tenantId: tenant.id,
      ...v,
      startDate: v.startDate!,
      endDate: v.endDate!,
      permitNo: await nextPermitNo(tenant.id),
      createdAt: now,
      updatedAt: now,
    })
    .run();

  revalidatePath("/permits");
  redirect("/permits");
}

export async function updatePermit(_state: PermitFormState, formData: FormData) {
  await requirePermission("permits:edit");
  const tenant = await getCurrentTenant();
  const permitId = String(formData.get("id") ?? "");
  const existing = db.select().from(workPermits).where(eq(workPermits.id, permitId)).get();
  if (!existing || existing.tenantId !== tenant.id) return { error: "Permit not found." };

  const v = parseCommon(formData);
  if (!v.permitType || !v.title || !v.startDate || !v.endDate) {
    return { error: "Permit type, title, start date, and end date are required." };
  }
  if (!PERMIT_TYPES.includes(v.permitType as never)) return { error: "Please choose a permit type." };
  if (!PERMIT_STATUSES.includes(v.status as never)) return { error: "Please choose a status." };

  db.update(workPermits)
    .set({ ...v, startDate: v.startDate!, endDate: v.endDate!, updatedAt: Date.now() })
    .where(eq(workPermits.id, permitId))
    .run();

  revalidatePath("/permits");
  redirect("/permits");
}

export async function deletePermit(formData: FormData) {
  await requirePermission("permits:delete");
  const tenant = await getCurrentTenant();
  const permitId = String(formData.get("id") ?? "");
  const existing = db.select().from(workPermits).where(eq(workPermits.id, permitId)).get();
  if (!existing || existing.tenantId !== tenant.id) return;
  db.delete(workPermits).where(eq(workPermits.id, permitId)).run();
  revalidatePath("/permits");
  redirect("/permits");
}