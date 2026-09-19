import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, teamMembers } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { PageHeader } from "@/components/page-header";
import { FindingForm } from "@/components/findings/finding-form";

export default async function NewFindingPage() {
  await requirePermission("findings:create");
  const tenant = await getCurrentTenant();

  const projectRows = db.select().from(projects).where(eq(projects.tenantId, tenant.id)).all();
  const teamRows = db.select().from(teamMembers).where(eq(teamMembers.tenantId, tenant.id)).orderBy(teamMembers.name).all();

  return (
    <div>
      <PageHeader title="New Finding" description="Record a safety observation or inspection finding" />
      <FindingForm
        projects={projectRows.map((p) => ({ id: p.id, name: p.name }))}
        teamMembers={teamRows.map((m) => ({ id: m.id, name: m.name }))}
      />
    </div>
  );
}