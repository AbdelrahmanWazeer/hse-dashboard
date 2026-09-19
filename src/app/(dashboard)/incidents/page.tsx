import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { incidents, projects } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { can } from "@/lib/permissions";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { IncidentsTable, type IncidentRow } from "@/components/incidents/incidents-table";
import Link from "next/link";

export default async function IncidentsPage() {
  const t = await getT();
  const locale = await getLocale();
  const user = await requirePermission("incidents:view");
  const tenant = await getCurrentTenant();

  const projectRows = db.select().from(projects).where(eq(projects.tenantId, tenant.id)).all();
  const projectMap = new Map(projectRows.map((p) => [p.id, p.name]));
  const incidentRows = db.select().from(incidents).where(eq(incidents.tenantId, tenant.id)).orderBy(desc(incidents.date)).all();

  const rows: IncidentRow[] = incidentRows.map((i) => ({
    id: i.id,
    incidentNo: i.incidentNo,
    incidentType: i.incidentType,
    description: i.description,
    personName: i.personName,
    projectName: i.projectId ? projectMap.get(i.projectId) ?? null : null,
    location: i.location,
    lostDays: i.lostDays ?? 0,
    date: i.date,
  }));

  return (
    <div>
      <PageHeader title="Incidents" description="Recorded safety events, injuries, near misses, and property damage">
        {can(user.role as never, "incidents:create") && (
          <Link href="/incidents/new">
            <Button>
              <Plus className="h-4 w-4" />
              {t("Log Incident", "تسجيل حادثة")}
            </Button>
          </Link>
        )}
      </PageHeader>
      <IncidentsTable
        incidents={rows}
        projectFilter={projectRows.map((p) => ({ value: p.id, label: p.name }))}
      />
    </div>
  );
}