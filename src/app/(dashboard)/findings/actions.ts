"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { findings, teamMembers, id, FINDING_CATEGORIES, FINDING_SEVERITIES, FINDING_STATUSES } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { fromDateInputValue } from "@/lib/utils";
import { logAudit } from "@/lib/audit";
import { sendNotificationEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

function notifyAssignee(tenantId: string, assigneeId: string, findingId: string, subject: string, body: string) {
  const member = db.select().from(teamMembers).where(eq(teamMembers.id, assigneeId)).get();
  if (!member?.email) return;
  sendNotificationEmail({
    to: member.email,
    recipientName: member.name,
    tenantName: "your workspace",
    subject,
    heading: "Finding assigned to you",
    body,
    ctaText: "View finding",
    ctaUrl: `/findings/${findingId}`,
  })
    .then(
      ({ ok, detail }) => {
        if (ok) {
          logger.info("notification.sent", { tenantId, findingId, to: member.email });
        } else {
          logger.warn("notification.failed", { tenantId, findingId, to: member.email, detail });
        }
      },
      (err) => logger.error("notification.error", { tenantId, findingId, detail: (err as Error).message })
    )
    .catch((err) => logger.error("notification.error", { tenantId, findingId, detail: (err as Error).message }));
}

export type FindingFormState = { error?: string };

function s(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function opt(formData: FormData, key: string) {
  const v = String(formData.get(key) ?? "").trim();
  return v ? v : null;
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

async function nextFindingNo(tenantId: string) {
  const rows = db.select().from(findings).where(eq(findings.tenantId, tenantId)).all();
  const year = new Date().getFullYear();
  const maxSeq = rows.reduce((m, f) => {
    const m2 = f.findingNo.match(/FND-\d{4}-(\d+)/);
    const seq = m2 ? Number(m2[1]) : 0;
    return Math.max(m, seq);
  }, 0);
  return `FND-${year}-${String(maxSeq + 1).padStart(4, "0")}`;
}

export async function createFinding(_state: FindingFormState, formData: FormData) {
  const user = await requirePermission("findings:create");
  const tenant = await getCurrentTenant();

  const title = s(formData, "title");
  const description = s(formData, "description");
  const category = s(formData, "category");
  const severity = s(formData, "severity");
  const status = s(formData, "status");

  if (!title || !description) return { error: "Title and description are required." };
  if (!FINDING_CATEGORIES.includes(category as never)) return { error: "Please choose a category." };
  if (!FINDING_SEVERITIES.includes(severity as never)) return { error: "Please choose a severity." };
  if (!FINDING_STATUSES.includes(status as never)) return { error: "Please choose a status." };

  const now = Date.now();
  const findingId = id("fnd");
  const findingNo = await nextFindingNo(tenant.id);
  const assignedToId = opt(formData, "assignedToId");
  db.insert(findings)
    .values({
      id: findingId,
      tenantId: tenant.id,
      projectId: opt(formData, "projectId") || undefined,
      findingNo,
      title,
      description,
      category,
      severity,
      status,
      location: opt(formData, "location"),
      assignedToId: assignedToId || undefined,
      dueDate: fromDateInputValue(String(formData.get("dueDate") ?? "")),
      rootCause: opt(formData, "rootCause"),
      correctiveAction: opt(formData, "correctiveAction"),
      remarks: opt(formData, "remarks"),
      photoUrls: photos(formData),
      createdAt: now,
      updatedAt: now,
    })
    .run();

  logAudit({
    tenantId: tenant.id,
    actorId: user.id,
    actorName: user.name,
    action: "finding.create",
    entityType: "finding",
    entityId: findingId,
    details: { findingNo, title, severity, category, status },
  });

  if (assignedToId) {
    notifyAssignee(
      tenant.id,
      assignedToId,
      findingId,
      `Finding ${findingNo}: ${title}`,
      `A new ${severity}-severity finding in "${category}" has been assigned to you:\n\n${title}\n\n${description}`
    );
  }

  revalidatePath("/findings");
  redirect(`/findings/${findingId}`);
}

export async function updateFinding(_state: FindingFormState, formData: FormData) {
  const user = await requirePermission("findings:edit");
  const tenant = await getCurrentTenant();
  const findingId = String(formData.get("id") ?? "");
  const existing = db.select().from(findings).where(eq(findings.id, findingId)).get();
  if (!existing || existing.tenantId !== tenant.id) return { error: "Finding not found." };

  const title = s(formData, "title");
  const description = s(formData, "description");
  const category = s(formData, "category");
  const severity = s(formData, "severity");
  const status = s(formData, "status");
  if (!title || !description) return { error: "Title and description are required." };
  if (!FINDING_CATEGORIES.includes(category as never)) return { error: "Please choose a category." };
  if (!FINDING_SEVERITIES.includes(severity as never)) return { error: "Please choose a severity." };
  if (!FINDING_STATUSES.includes(status as never)) return { error: "Please choose a status." };

  const now = Date.now();
  const isClosing = status === "closed" && existing.status !== "closed";
  const nextAssignee = opt(formData, "assignedToId");
  db.update(findings)
    .set({
      projectId: opt(formData, "projectId") || undefined,
      title,
      description,
      category,
      severity,
      status,
      location: opt(formData, "location"),
      assignedToId: nextAssignee || undefined,
      dueDate: fromDateInputValue(String(formData.get("dueDate") ?? "")),
      rootCause: opt(formData, "rootCause"),
      correctiveAction: opt(formData, "correctiveAction"),
      remarks: opt(formData, "remarks"),
      photoUrls: photos(formData),
      closedAt: isClosing ? now : status === "open" ? null : existing.closedAt,
      closedById: isClosing ? user.id : existing.closedById,
      updatedAt: now,
    })
    .where(eq(findings.id, findingId))
    .run();

  if (nextAssignee && nextAssignee !== existing.assignedToId) {
    notifyAssignee(
      tenant.id,
      nextAssignee,
      findingId,
      `Finding ${existing.findingNo}: ${title}`,
      `Finding "${title}" has been reassigned to you (status: ${status}).\n\n${description}`
    );
  }

  revalidatePath("/findings");
  revalidatePath(`/findings/${findingId}`);

  logAudit({
    tenantId: tenant.id,
    actorId: user.id,
    actorName: user.name,
    action: isClosing ? "finding.close" : "finding.update",
    entityType: "finding",
    entityId: findingId,
    details: { nextStatus: status, previousStatus: existing.status },
  });

  redirect(`/findings/${findingId}`);
}

export async function deleteFinding(formData: FormData) {
  const user = await requirePermission("findings:delete");
  const tenant = await getCurrentTenant();
  const findingId = String(formData.get("id") ?? "");
  const existing = db.select().from(findings).where(eq(findings.id, findingId)).get();
  if (!existing || existing.tenantId !== tenant.id) return;
  db.delete(findings).where(eq(findings.id, findingId)).run();
  logAudit({
    tenantId: tenant.id,
    actorId: user.id,
    actorName: user.name,
    action: "finding.delete",
    entityType: "finding",
    entityId: findingId,
    details: { findingNo: existing.findingNo, title: existing.title },
  });
  revalidatePath("/findings");
  redirect("/findings");
}