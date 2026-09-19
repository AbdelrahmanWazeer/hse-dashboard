import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { PageHeader } from "@/components/page-header";
import { IncidentForm } from "@/components/incidents/incident-form";

export default async function NewIncidentPage() {
  await requirePermission("incidents:create");
  const tenant = await getCurrentTenant();
  const projectRows = db.select().from(projects).where(eq(projects.tenantId, tenant.id)).all();

  return (
    <div>
      <PageHeader title="Log Incident" description="Record a safety event, injury, near miss, or damage" />
      <IncidentForm projects={projectRows.map((p) => ({ id: p.id, name: p.name }))} />
    </div>
  );
}