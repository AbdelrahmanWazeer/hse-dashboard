import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ppeItems } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";
import { PpeItemForm } from "@/components/inventory/ppe-item-form";

export default async function EditPpeItemPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const locale = await getLocale();
  await requirePermission("inventory:manage");
  const tenant = await getCurrentTenant();
  const { id } = await params;

  const item = db.select().from(ppeItems).where(eq(ppeItems.id, id)).get();
  if (!item || item.tenantId !== tenant.id) notFound();

  return (
    <div>
      <PageHeader title="Edit PPE Item" description={item.name} />
      <PpeItemForm
        isEdit
        initial={{
          id: item.id,
          name: item.name,
          category: item.category,
          size: item.size,
          brand: item.brand,
          description: item.description,
          totalStock: item.totalStock,
          safetyStock: item.safetyStock,
          unit: item.unit,
          storageLocation: item.storageLocation,
          pricePerUnit: item.pricePerUnit,
          minReorderLevel: item.minReorderLevel,
          photoUrl: item.photoUrl,
        }}
      />
    </div>
  );
}