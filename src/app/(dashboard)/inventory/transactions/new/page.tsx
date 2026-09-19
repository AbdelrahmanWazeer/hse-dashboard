import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ppeItems, teamMembers } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";
import { PpeTransactionForm } from "@/components/inventory/ppe-transaction-form";

export default async function NewPpeTransactionPage() {
  const t = await getT();
  const locale = await getLocale();
  await requirePermission("inventory:manage");
  const tenant = await getCurrentTenant();

  const items = db.select().from(ppeItems).where(eq(ppeItems.tenantId, tenant.id)).all();
  const teamRows = db.select().from(teamMembers).where(eq(teamMembers.tenantId, tenant.id)).orderBy(teamMembers.name).all();

  return (
    <div>
      <PageHeader title="New PPE Transaction" description="Receive, issue, return, or adjust stock" />
      <PpeTransactionForm
        items={items.map((i) => ({ id: i.id, name: i.name, available: i.available }))}
        teamMembers={teamRows.map((m) => ({ id: m.id, name: m.name }))}
      />
    </div>
  );
}