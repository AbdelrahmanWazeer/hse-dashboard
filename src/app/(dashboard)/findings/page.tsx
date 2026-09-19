import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { findings, projects } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { can } from "@/lib/permissions";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FindingsTable, type FindingRow } from "@/components/findings/findings-table";
import Link from "next/link";

export default async function FindingsPage() {
  const t = await getT();
  const locale = await getLocale();
  const user = await requirePermission("findings:view");
  const tenant = await getCurrentTenant();

  const projectRows = db.select().from(projects).where(eq(projects.tenantId, tenant.id)).all();
  const projectMap = new Map(projectRows.map((p) => [p.id, p.name]));

  const findingRows = db.select().from(findings).where(eq(findings.tenantId, tenant.id)).orderBy(desc(findings.createdAt)).all();

  const rows: FindingRow[] = findingRows.map((f) => ({
    id: f.id,
    findingNo: f.findingNo,
    title: f.title,
    category: f.category,
    severity: f.severity,
    status: f.status,
    projectName: f.projectId ? projectMap.get(f.projectId) ?? null : null,
    location: f.location,
    createdAt: f.createdAt,
  }));

  return (
    <div>
      <PageHeader title="Findings" description="Safety observations, inspections, and corrective actions">
        {can(user.role as never, "findings:create") && (
          <Link href="/findings/new">
            <Button>
              <Plus className="h-4 w-4" />
              {t("New Finding", "ملاحظة جديدة")}
            </Button>
          </Link>
        )}
      </PageHeader>
      <FindingsTable
        findings={rows}
        projects={projectRows.map((p) => ({ value: p.id, label: p.name }))}
      />
    </div>
  );
}