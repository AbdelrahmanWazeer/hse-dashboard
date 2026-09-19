import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tbtRecords, projects, teamMembers } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";
import { TbtForm } from "@/components/records/tbt-form";

export default async function EditTbtPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const locale = await getLocale();
  await requirePermission("stats:edit");
  const tenant = await getCurrentTenant();
  const { id } = await params;

  const record = db.select().from(tbtRecords).where(eq(tbtRecords.id, id)).get();
  if (!record || record.tenantId !== tenant.id) notFound();

  const projectRows = db.select().from(projects).where(eq(projects.tenantId, tenant.id)).all();
  const memberRows = db.select().from(teamMembers).where(eq(teamMembers.tenantId, tenant.id)).orderBy(teamMembers.name).all();

  return (
    <div>
      <PageHeader title="Edit Toolbox Talk" description={record.title} />
      <TbtForm
        projects={projectRows.map((p) => ({ id: p.id, name: p.name }))}
        teamMembers={memberRows.map((m) => ({ id: m.id, name: m.name }))}
        initial={{
          id: record.id,
          projectId: record.projectId,
          title: record.title,
          topic: record.topic,
          date: record.date,
          conductedById: record.conductedBy,
          attendees: record.attendees,
          durationMinutes: record.durationMinutes,
          notes: record.notes,
          photoUrls: record.photoUrls ?? [],
        }}
      />
    </div>
  );
}