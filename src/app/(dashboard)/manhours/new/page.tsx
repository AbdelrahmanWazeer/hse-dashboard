import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";
import { ManhourForm } from "@/components/records/manhour-form";

export default async function NewManhourPage() {
  const t = await getT();
  const locale = await getLocale();
  await requirePermission("stats:create");
  const tenant = await getCurrentTenant();

  const projectRows = db.select().from(projects).where(eq(projects.tenantId, tenant.id)).all();

  return (
    <div>
      <PageHeader title="Add Man-hours Entry" description="Record daily man-hours for the site" />
      <ManhourForm projects={projectRows.map((p) => ({ id: p.id, name: p.name }))} />
    </div>
  );
}