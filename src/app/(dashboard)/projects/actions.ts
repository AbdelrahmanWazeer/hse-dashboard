"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, teamMembers, id } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { fromDateInputValue } from "@/lib/utils";
import { logAudit } from "@/lib/audit";

const PROJECT_STATUSES = ["active", "on_hold", "completed"] as const;

export type ProjectFormState = { error?: string };

function s(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function opt(formData: FormData, key: string) {
  const v = String(formData.get(key) ?? "").trim();
  return v ? v : null;
}

export async function createProject(_state: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const user = await requirePermission("team:manage");
  const tenant = await getCurrentTenant();

  const name = s(formData, "name");
  if (!name) return { error: "Project name is required." };

  const status = opt(formData, "status") ?? "active";
  if (!PROJECT_STATUSES.includes(status as never)) return { error: "Please choose a status." };

  const hseManagerId = opt(formData, "hseManagerId");
  if (hseManagerId) {
    const member = db.select().from(teamMembers).where(eq(teamMembers.id, hseManagerId)).get();
    if (!member || member.tenantId !== tenant.id) return { error: "Please choose a valid HSE manager." };
  }

  const now = Date.now();
  const projectId = id("prj");
  db.insert(projects)
    .values({
      id: projectId,
      tenantId: tenant.id,
      name,
      code: opt(formData, "code"),
      description: opt(formData, "description"),
      location: opt(formData, "location"),
      status,
      startDate: fromDateInputValue(String(formData.get("startDate") ?? "")),
      endDate: fromDateInputValue(String(formData.get("endDate") ?? "")),
      hseManagerId: hseManagerId || undefined,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  logAudit({
    tenantId: tenant.id,
    actorId: user.id,
    actorName: user.name,
    action: "project.create",
    entityType: "project",
    entityId: projectId,
    details: { name, code: opt(formData, "code"), status },
  });

  revalidatePath("/projects");
  redirect("/projects");
}