"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { incidents, id, INCIDENT_TYPES } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { fromDateInputValue } from "@/lib/utils";
import { logAudit } from "@/lib/audit";

export type IncidentFormState = { error?: string };

function s(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function opt(formData: FormData, key: string) {
  const v = s(formData, key);
  return v ? v : null;
}

function int(formData: FormData, key: string, fallback = 0) {
  const v = Number(s(formData, key));
  return Number.isFinite(v) ? v : fallback;
}

function numOrNull(formData: FormData, key: string) {
  const v = s(formData, key);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function photos(formData: FormData): string[] {
  const raw = String(formData.get("photoUrls") ?? "").trim();
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

async function nextIncidentNo(tenantId: string) {
  const rows = db.select().from(incidents).where(eq(incidents.tenantId, tenantId)).all();
  const year = new Date().getFullYear();
  const maxSeq = rows.reduce((m, i) => {
    const m2 = i.incidentNo.match(/INC-\d{4}-(\d+)/);
    const seq = m2 ? Number(m2[1]) : 0;
    return Math.max(m, seq);
  }, 0);
  return `INC-${year}-${String(maxSeq + 1).padStart(4, "0")}`;
}

function parseCommon(formData: FormData) {
  const incidentType = s(formData, "incidentType");
  const description = s(formData, "description");
  const status = s(formData, "status");
  const lostDays = int(formData, "lostDays");
  const restrictedDays = int(formData, "restrictedDays");
  const date = fromDateInputValue(String(formData.get("date") ?? ""));
  return {
    incidentType,
    description,
    status,
    lostDays,
    restrictedDays,
    date,
    time: opt(formData, "time"),
    location: opt(formData, "location"),
    personName: opt(formData, "personName"),
    personCompany: opt(formData, "personCompany"),
    jobTitle: opt(formData, "jobTitle"),
    age: s(formData, "age") ? int(formData, "age") : null,
    gender: opt(formData, "gender"),
    bodyPart: opt(formData, "bodyPart"),
    natureOfInjury: opt(formData, "natureOfInjury"),
    cause: opt(formData, "cause"),
    immediateAction: opt(formData, "immediateAction"),
    investigation: opt(formData, "investigation"),
    rootCause: opt(formData, "rootCause"),
    correctiveActions: opt(formData, "correctiveActions"),
    medicalTreatmentCost: numOrNull(formData, "medicalTreatmentCost"),
    propertyDamageCost: numOrNull(formData, "propertyDamageCost"),
    projectId: opt(formData, "projectId"),
    photoUrls: photos(formData),
  };
}

export async function createIncident(_state: IncidentFormState, formData: FormData) {
  const user = await requirePermission("incidents:create");
  const tenant = await getCurrentTenant();

  const v = parseCommon(formData);
  if (!v.incidentType || !v.description || !v.date) {
    return { error: "Incident type, date, and description are required." };
  }
  if (!INCIDENT_TYPES.includes(v.incidentType as never)) return { error: "Please choose an incident type." };
  if (!["reported", "investigating", "closed"].includes(v.status)) return { error: "Please choose a status." };

  const now = Date.now();
  const incidentId = id("inc");
  db.insert(incidents)
    .values({
      id: incidentId,
      tenantId: tenant.id,
      ...v,
      date: v.date!,
      incidentNo: await nextIncidentNo(tenant.id),
      isLTI: v.incidentType === "lti" || v.lostDays > 0,
      status: v.status,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  logAudit({
    tenantId: tenant.id,
    actorId: user.id,
    actorName: user.name,
    action: "incident.create",
    entityType: "incident",
    entityId: incidentId,
    details: { incidentType: v.incidentType, personName: v.personName, location: v.location },
  });

  revalidatePath("/incidents");
  redirect(`/incidents/${incidentId}`);
}

export async function updateIncident(_state: IncidentFormState, formData: FormData) {
  const user = await requirePermission("incidents:edit");
  const tenant = await getCurrentTenant();
  const incidentId = String(formData.get("id") ?? "");
  const existing = db.select().from(incidents).where(eq(incidents.id, incidentId)).get();
  if (!existing || existing.tenantId !== tenant.id) return { error: "Incident not found." };

  const v = parseCommon(formData);
  if (!v.incidentType || !v.description || !v.date) {
    return { error: "Incident type, date, and description are required." };
  }
  if (!INCIDENT_TYPES.includes(v.incidentType as never)) return { error: "Please choose an incident type." };
  if (!["reported", "investigating", "closed"].includes(v.status)) return { error: "Please choose a status." };

  db.update(incidents)
    .set({
      ...v,
      date: v.date!,
      isLTI: v.incidentType === "lti" || v.lostDays > 0,
      updatedAt: Date.now(),
    })
    .where(eq(incidents.id, incidentId))
    .run();

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${incidentId}`);

  logAudit({
    tenantId: tenant.id,
    actorId: user.id,
    actorName: user.name,
    action: v.status !== existing.status ? "incident.status_change" : "incident.update",
    entityType: "incident",
    entityId: incidentId,
    details: { nextStatus: v.status, previousStatus: existing.status, incidentType: v.incidentType },
  });

  redirect(`/incidents/${incidentId}`);
}

export async function deleteIncident(formData: FormData) {
  const user = await requirePermission("incidents:delete");
  const tenant = await getCurrentTenant();
  const incidentId = String(formData.get("id") ?? "");
  const existing = db.select().from(incidents).where(eq(incidents.id, incidentId)).get();
  if (!existing || existing.tenantId !== tenant.id) return;
  db.delete(incidents).where(eq(incidents.id, incidentId)).run();
  logAudit({
    tenantId: tenant.id,
    actorId: user.id,
    actorName: user.name,
    action: "incident.delete",
    entityType: "incident",
    entityId: incidentId,
    details: { incidentNo: existing.incidentNo, incidentType: existing.incidentType },
  });
  revalidatePath("/incidents");
  redirect("/incidents");
}