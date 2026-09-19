import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";
import { InductionForm } from "@/components/records/induction-form";

export default async function NewInductionPage() {
  const t = await getT();
  const locale = await getLocale();
  await requirePermission("stats:create");
  const tenant = await getCurrentTenant();

  const projectRows = db.select().from(projects).where(eq(projects.tenantId, tenant.id)).all();

  return (
    <div>
      <PageHeader title="New Induction" description="Record a personnel induction" />
      <InductionForm projects={projectRows.map((p) => ({ id: p.id, name: p.name }))} />
    </div>
  );
}