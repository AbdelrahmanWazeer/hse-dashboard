import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { PageHeader } from "@/components/page-header";
import { CourseForm, type CourseFormData } from "@/components/courses/course-form";

export const dynamic = "force-dynamic";

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("courses:manage");
  const tenant = await getCurrentTenant();
  const row = db.select().from(courses).where(eq(courses.id, id)).get();
  if (!row || row.tenantId !== tenant.id) notFound();

  const initial: CourseFormData = {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    provider: row.provider,
    level: row.level,
    durationMinutes: row.durationMinutes,
    coverUrl: row.coverUrl,
    courseUrl: row.courseUrl,
    tags: Array.isArray(row.tags) ? row.tags : [],
    status: row.status,
  };

  return (
    <div>
      <PageHeader title="Edit Course" />
      <CourseForm initial={initial} />
    </div>
  );
}