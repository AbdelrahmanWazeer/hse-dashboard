import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { workPermits, projects } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { can } from "@/lib/permissions";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PermitsTable, type PermitRow } from "@/components/permits/permits-table";
import Link from "next/link";

export default async function PermitsPage() {
  const t = await getT();
  const locale = await getLocale();
  const user = await requirePermission("permits:view");
  const tenant = await getCurrentTenant();

  const projectRows = db.select().from(projects).where(eq(projects.tenantId, tenant.id)).all();
  const projectMap = new Map(projectRows.map((p) => [p.id, p.name]));
  const permitRows = db.select().from(workPermits).where(eq(workPermits.tenantId, tenant.id)).orderBy(desc(workPermits.startDate)).all();

  const rows: PermitRow[] = permitRows.map((p) => ({
    id: p.id,
    permitNo: p.permitNo,
    permitType: p.permitType,
    title: p.title,
    location: p.location,
    status: p.status,
    startDate: p.startDate,
    endDate: p.endDate,
    projectName: p.projectId ? projectMap.get(p.projectId) ?? null : null,
    hasCoords: p.locationX != null && p.locationY != null,
  }));

  return (
    <div>
      <PageHeader title="Work Permits" description="Active and historical work permits across projects">
        {can(user.role as never, "permits:create") && (
          <Link href="/permits/new">
            <Button>
              <Plus className="h-4 w-4" />
              {t("New Permit", "تصريح جديد")}
            </Button>
          </Link>
        )}
      </PageHeader>
      <PermitsTable permits={rows} />
    </div>
  );
}