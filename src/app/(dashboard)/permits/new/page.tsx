import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, teamMembers } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";
import { PermitForm } from "@/components/permits/permit-form";

export default async function NewPermitPage() {
  const t = await getT();
  const locale = await getLocale();
  await requirePermission("permits:create");
  const tenant = await getCurrentTenant();

  const projectRows = db.select().from(projects).where(eq(projects.tenantId, tenant.id)).all();
  const teamRows = db.select().from(teamMembers).where(eq(teamMembers.tenantId, tenant.id)).orderBy(teamMembers.name).all();

  return (
    <div>
      <PageHeader title="New Work Permit" description="Create a work permit for a scope of work" />
      <PermitForm
        projects={projectRows.map((p) => ({ id: p.id, name: p.name }))}
        teamMembers={teamRows.map((m) => ({ id: m.id, name: m.name }))}
      />
    </div>
  );
}