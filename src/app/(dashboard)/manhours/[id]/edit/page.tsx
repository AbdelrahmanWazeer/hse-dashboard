import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { manhours, projects } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { ManhourForm } from "@/components/records/manhour-form";

export default async function EditManhourPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const locale = await getLocale();
  await requirePermission("stats:edit");
  const tenant = await getCurrentTenant();
  const { id } = await params;

  const record = db.select().from(manhours).where(eq(manhours.id, id)).get();
  if (!record || record.tenantId !== tenant.id) notFound();

  const projectRows = db.select().from(projects).where(eq(projects.tenantId, tenant.id)).all();

  return (
    <div>
      <PageHeader title="Edit Man-hours Entry" description={formatDate(record.date, locale)} />
      <ManhourForm
        projects={projectRows.map((p) => ({ id: p.id, name: p.name }))}
        initial={{
          id: record.id,
          projectId: record.projectId,
          date: record.date,
          manhours: record.manhours,
        }}
      />
    </div>
  );
}