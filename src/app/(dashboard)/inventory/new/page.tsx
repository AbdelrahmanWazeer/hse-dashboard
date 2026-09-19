import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ppeItems } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";
import { PpeItemForm } from "@/components/inventory/ppe-item-form";

export default async function NewPpeItemPage() {
  const t = await getT();
  const locale = await getLocale();
  await requirePermission("inventory:manage");
  const tenant = await getCurrentTenant();
  void tenant;
  return (
    <div>
      <PageHeader title="Add PPE Item" description="Add an item to the inventory" />
      <PpeItemForm />
    </div>
  );
}