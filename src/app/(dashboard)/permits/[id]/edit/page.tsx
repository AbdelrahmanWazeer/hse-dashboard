import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { workPermits, projects, teamMembers } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";
import { PermitForm } from "@/components/permits/permit-form";

export default async function EditPermitPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const locale = await getLocale();
  await requirePermission("permits:edit");
  const tenant = await getCurrentTenant();
  const { id } = await params;

  const permit = db.select().from(workPermits).where(eq(workPermits.id, id)).get();
  if (!permit || permit.tenantId !== tenant.id) notFound();

  const projectRows = db.select().from(projects).where(eq(projects.tenantId, tenant.id)).all();
  const teamRows = db.select().from(teamMembers).where(eq(teamMembers.tenantId, tenant.id)).orderBy(teamMembers.name).all();

  return (
    <div>
      <PageHeader title="Edit Work Permit" description={permit.permitNo} />
      <PermitForm
        projects={projectRows.map((p) => ({ id: p.id, name: p.name }))}
        teamMembers={teamRows.map((m) => ({ id: m.id, name: m.name }))}
        initial={{
          id: permit.id,
          projectId: permit.projectId,
          permitType: permit.permitType,
          title: permit.title,
          description: permit.description,
          location: permit.location,
          locationX: permit.locationX,
          locationY: permit.locationY,
          startDate: permit.startDate,
          endDate: permit.endDate,
          status: permit.status,
          assignedTo: permit.assignedTo,
          ppeRequired: permit.ppeRequired ?? [],
          hazards: permit.hazards ?? [],
          controls: permit.controls ?? [],
          isolation: permit.isolation,
          remarks: permit.remarks,
        }}
      />
    </div>
  );
}