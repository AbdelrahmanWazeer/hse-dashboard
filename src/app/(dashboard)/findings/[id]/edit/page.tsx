import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { findings, projects, teamMembers } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { PageHeader } from "@/components/page-header";
import { FindingForm } from "@/components/findings/finding-form";

export default async function EditFindingPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("findings:edit");
  const tenant = await getCurrentTenant();
  const { id } = await params;

  const finding = db.select().from(findings).where(eq(findings.id, id)).get();
  if (!finding || finding.tenantId !== tenant.id) notFound();

  const projectRows = db.select().from(projects).where(eq(projects.tenantId, tenant.id)).all();
  const teamRows = db.select().from(teamMembers).where(eq(teamMembers.tenantId, tenant.id)).orderBy(teamMembers.name).all();

  return (
    <div>
      <PageHeader title="Edit Finding" description={`${finding.findingNo} · ${finding.title}`} />
      <FindingForm
        projects={projectRows.map((p) => ({ id: p.id, name: p.name }))}
        teamMembers={teamRows.map((m) => ({ id: m.id, name: m.name }))}
        initial={{
          id: finding.id,
          title: finding.title,
          description: finding.description,
          category: finding.category,
          severity: finding.severity,
          status: finding.status,
          location: finding.location,
          projectId: finding.projectId,
          assignedToId: finding.assignedToId,
          dueDate: finding.dueDate,
          rootCause: finding.rootCause,
          correctiveAction: finding.correctiveAction,
          remarks: finding.remarks,
          photoUrls: finding.photoUrls ?? [],
        }}
      />
    </div>
  );
}