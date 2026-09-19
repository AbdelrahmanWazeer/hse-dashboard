import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, teamMembers } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";
import { TbtForm } from "@/components/records/tbt-form";

export default async function NewTbtPage() {
  const t = await getT();
  const locale = await getLocale();
  await requirePermission("stats:create");
  const tenant = await getCurrentTenant();

  const projectRows = db.select().from(projects).where(eq(projects.tenantId, tenant.id)).all();
  const memberRows = db.select().from(teamMembers).where(eq(teamMembers.tenantId, tenant.id)).orderBy(teamMembers.name).all();

  return (
    <div>
      <PageHeader title="Record Toolbox Talk" description="Log a toolbox talk session and attendance" />
      <TbtForm
        projects={projectRows.map((p) => ({ id: p.id, name: p.name }))}
        teamMembers={memberRows.map((m) => ({ id: m.id, name: m.name }))}
      />
    </div>
  );
}