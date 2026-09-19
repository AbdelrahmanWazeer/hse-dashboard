"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, courseProgress, id, COURSE_STATUSES } from "@/lib/db/schema";
import { requirePermission, requireUser } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { logAudit } from "@/lib/audit";
import { COURSE_CATEGORIES, COURSE_LEVELS } from "@/lib/constants";

export type CourseFormState = { error?: string };

function s(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function opt(formData: FormData, key: string) {
  const v = s(formData, key);
  return v ? v : null;
}

function tags(formData: FormData): string[] {
  return s(formData, "tags")
    .split(/[,،\n]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function cover(formData: FormData): string | null {
  const raw = s(formData, "coverUrl");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const first = parsed.find(
        (u): u is string => typeof u === "string" && (u.startsWith("/") || u.startsWith("http://") || u.startsWith("https://"))
      );
      return first ?? null;
    }
    if (typeof parsed === "string" && (parsed.startsWith("/") || parsed.startsWith("http://") || parsed.startsWith("https://"))) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function urlOnly(value: string | null): string | null {
  if (!value) return null;
  return value.startsWith("http://") || value.startsWith("https://") ? value : null;
}

function parse(formData: FormData): { error?: string; data?: Record<string, unknown> } {
  const title = s(formData, "title");
  if (!title) return { error: "Course title is required." };

  const category = opt(formData, "category") ?? "other";
  const level = opt(formData, "level") ?? "beginner";
  if (!COURSE_CATEGORIES.some((c) => c.value === category)) return { error: "Please choose a valid category." };
  if (!COURSE_LEVELS.some((l) => l.value === level)) return { error: "Please choose a valid level." };

  const rawMinutes = s(formData, "durationMinutes");
  const minutes = rawMinutes ? Number(rawMinutes) : 0;
  const durationMinutes = Number.isFinite(minutes) && minutes >= 0 ? Math.floor(minutes) : 0;

  return {
    data: {
      title,
      description: opt(formData, "description"),
      category,
      provider: opt(formData, "provider"),
      level,
      durationMinutes,
      courseUrl: urlOnly(opt(formData, "courseUrl")),
      coverUrl: cover(formData),
      tags: tags(formData),
      status: s(formData, "publish") === "1" ? "published" : undefined,
    },
  };
}

function getCourse(tenantId: string, courseId: string) {
  const row = db.select().from(courses).where(eq(courses.id, courseId)).get();
  if (!row || row.tenantId !== tenantId) return null;
  return row;
}

export async function createCourse(_state: CourseFormState, formData: FormData): Promise<CourseFormState> {
  const user = await requirePermission("courses:manage");
  const tenant = await getCurrentTenant();
  const parsed = parse(formData);
  if (parsed.error || !parsed.data) return { error: parsed.error };
  const d = parsed.data;

  const now = Date.now();
  const courseId = id("crs");
  db.insert(courses)
    .values({
      id: courseId,
      tenantId: tenant.id,
      title: d.title as string,
      description: (d.description as string | null) ?? undefined,
      category: d.category as string,
      provider: (d.provider as string | null) ?? undefined,
      level: d.level as string,
      durationMinutes: d.durationMinutes as number,
      coverUrl: (d.coverUrl as string | null) ?? undefined,
      courseUrl: (d.courseUrl as string | null) ?? undefined,
      tags: d.tags as string[],
      status: (d.status as (typeof COURSE_STATUSES)[number] | undefined) ?? "draft",
      createdById: user.id,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  logAudit({
    tenantId: tenant.id,
    actorId: user.id,
    actorName: user.name,
    action: "course.create",
    entityType: "course",
    entityId: courseId,
    details: { title: d.title as string, status: d.status ?? "draft" },
  });

  revalidatePath("/courses");
  redirect("/courses");
}

export async function updateCourse(_state: CourseFormState, formData: FormData): Promise<CourseFormState> {
  const user = await requirePermission("courses:manage");
  const tenant = await getCurrentTenant();
  const courseId = s(formData, "id");
  const existing = getCourse(tenant.id, courseId);
  if (!existing) return { error: "Course not found." };

  const parsed = parse(formData);
  if (parsed.error || !parsed.data) return { error: parsed.error };
  const d = parsed.data;

  db.update(courses)
    .set({
      title: d.title as string,
      description: (d.description as string | null) ?? null,
      category: d.category as string,
      provider: (d.provider as string | null) ?? null,
      level: d.level as string,
      durationMinutes: d.durationMinutes as number,
      coverUrl: (d.coverUrl as string | null) ?? null,
      courseUrl: (d.courseUrl as string | null) ?? null,
      tags: d.tags as string[],
      status: (d.status as (typeof COURSE_STATUSES)[number] | undefined) ?? existing.status,
      updatedAt: Date.now(),
    })
    .where(eq(courses.id, courseId))
    .run();

  logAudit({
    tenantId: tenant.id,
    actorId: user.id,
    actorName: user.name,
    action: "course.update",
    entityType: "course",
    entityId: courseId,
    details: { title: d.title as string, status: d.status ?? existing.status },
  });

  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  redirect(`/courses/${courseId}`);
}

export async function deleteCourse(formData: FormData) {
  const user = await requirePermission("courses:manage");
  const tenant = await getCurrentTenant();
  const courseId = String(formData.get("id") ?? "");
  const existing = getCourse(tenant.id, courseId);
  if (!existing) return;
  db.delete(courses).where(eq(courses.id, courseId)).run();
  logAudit({
    tenantId: tenant.id,
    actorId: user.id,
    actorName: user.name,
    action: "course.delete",
    entityType: "course",
    entityId: courseId,
    details: { title: existing.title },
  });
  revalidatePath("/courses");
  redirect("/courses");
}

export async function setCourseStatus(formData: FormData) {
  const user = await requirePermission("courses:manage");
  const tenant = await getCurrentTenant();
  const courseId = String(formData.get("id") ?? "");
  const rawStatus = String(formData.get("status") ?? "");
  if (!COURSE_STATUSES.includes(rawStatus as never)) return;
  const existing = getCourse(tenant.id, courseId);
  if (!existing) return;
  db.update(courses)
    .set({ status: rawStatus, updatedAt: Date.now() })
    .where(eq(courses.id, courseId))
    .run();
  logAudit({
    tenantId: tenant.id,
    actorId: user.id,
    actorName: user.name,
    action: "course.status",
    entityType: "course",
    entityId: courseId,
    details: { title: existing.title, status: rawStatus },
  });
  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
}

export async function enrollCourse(formData: FormData) {
  const user = await requireUser();
  const tenant = await getCurrentTenant();
  const courseId = String(formData.get("id") ?? "");
  const course = getCourse(tenant.id, courseId);
  if (!course || course.status === "archived") return;

  const existing = db
    .select()
    .from(courseProgress)
    .where(and(eq(courseProgress.courseId, courseId), eq(courseProgress.userId, user.id)))
    .get();
  if (existing) return;

  const now = Date.now();
  db.insert(courseProgress)
    .values({
      id: id("cpr"),
      tenantId: tenant.id,
      courseId,
      userId: user.id,
      status: "enrolled",
      progress: 0,
      enrolledAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  logAudit({
    tenantId: tenant.id,
    actorId: user.id,
    actorName: user.name,
    action: "course.enroll",
    entityType: "course",
    entityId: courseId,
    details: { title: course.title },
  });

  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
}

export async function updateCourseProgress(formData: FormData) {
  const user = await requireUser();
  const tenant = await getCurrentTenant();
  const courseId = String(formData.get("id") ?? "");
  const raw = Number(String(formData.get("progress") ?? "0"));
  const progress = Math.max(0, Math.min(100, Number.isFinite(raw) ? Math.floor(raw) : 0));
  const course = getCourse(tenant.id, courseId);
  if (!course) return;

  const existing = db
    .select()
    .from(courseProgress)
    .where(and(eq(courseProgress.courseId, courseId), eq(courseProgress.userId, user.id)))
    .get();
  if (!existing) return;

  const completed = progress >= 100;
  db.update(courseProgress)
    .set({
      status: completed ? "completed" : progress > 0 ? "in_progress" : "enrolled",
      progress,
      completedAt: completed ? Date.now() : null,
      updatedAt: Date.now(),
    })
    .where(eq(courseProgress.id, existing.id))
    .run();

  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
}

export async function resetCourse(formData: FormData) {
  const user = await requireUser();
  const tenant = await getCurrentTenant();
  const courseId = String(formData.get("id") ?? "");
  const existing = db
    .select()
    .from(courseProgress)
    .where(and(eq(courseProgress.courseId, courseId), eq(courseProgress.userId, user.id)))
    .get();
  if (!existing || existing.tenantId !== tenant.id) return;

  db.delete(courseProgress).where(eq(courseProgress.id, existing.id)).run();

  logAudit({
    tenantId: tenant.id,
    actorId: user.id,
    actorName: user.name,
    action: "course.reset",
    entityType: "course",
    entityId: courseId,
    details: { title: getCourse(tenant.id, courseId)?.title },
  });

  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
}