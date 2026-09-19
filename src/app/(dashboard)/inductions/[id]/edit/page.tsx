import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { inductions, projects } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";
import { InductionForm } from "@/components/records/induction-form";

export default async function EditInductionPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const locale = await getLocale();
  await requirePermission("stats:edit");
  const tenant = await getCurrentTenant();
  const { id } = await params;

  const record = db.select().from(inductions).where(eq(inductions.id, id)).get();
  if (!record || record.tenantId !== tenant.id) notFound();

  const projectRows = db.select().from(projects).where(eq(projects.tenantId, tenant.id)).all();

  return (
    <div>
      <PageHeader title="Edit Induction" description={record.personnelName} />
      <InductionForm
        projects={projectRows.map((p) => ({ id: p.id, name: p.name }))}
        initial={{
          id: record.id,
          projectId: record.projectId,
          personnelName: record.personnelName,
          company: record.company,
          idNumber: record.idNumber,
          inductionType: record.inductionType,
          date: record.date,
          trainer: record.trainer,
          status: record.status,
          expiryDate: record.expiryDate,
          notes: record.notes,
        }}
      />
    </div>
  );
}