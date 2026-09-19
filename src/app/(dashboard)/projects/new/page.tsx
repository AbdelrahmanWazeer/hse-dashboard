import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { teamMembers } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { PageHeader } from "@/components/page-header";
import { ProjectForm } from "@/components/records/project-form";

export default async function NewProjectPage() {
  await requirePermission("team:manage");
  const tenant = await getCurrentTenant();

  const memberRows = db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.tenantId, tenant.id))
    .orderBy(teamMembers.name)
    .all();

  return (
    <div>
      <PageHeader title="New Project" description="Add an HSE project to this company" />
      <ProjectForm
        teamMembers={memberRows.map((m) => ({ id: m.id, name: m.name, jobTitle: m.jobTitle }))}
      />
    </div>
  );
}