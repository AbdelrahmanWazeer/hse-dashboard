import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ppeItems, ppeTransactions } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { can } from "@/lib/permissions";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableRow, TableHeader, TableHead, TableCell } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Plus, Package, AlertTriangle, DollarSign, ArrowDownUp, Pencil } from "lucide-react";
import Link from "next/link";

export default async function InventoryPage() {
  const t = await getT();
  const locale = await getLocale();
  const user = await requirePermission("inventory:view");
  const tenant = await getCurrentTenant();
  const tenantId = tenant.id;
  const canManage = can(user.role as never, "inventory:manage");

  const items = db.select().from(ppeItems).where(eq(ppeItems.tenantId, tenantId)).all();
  const txns = db
    .select()
    .from(ppeTransactions)
    .where(eq(ppeTransactions.tenantId, tenantId))
    .orderBy(desc(ppeTransactions.date))
    .limit(12)
    .all();

  const itemMap = new Map(items.map((i) => [i.id, i]));

  const totalStock = items.reduce((a, i) => a + i.totalStock, 0);
  const totalAvailable = items.reduce((a, i) => a + i.available, 0);
  const lowStock = items.filter((i) => i.available < i.minReorderLevel);
  const totalValue = items.reduce((a, i) => a + i.available * (i.pricePerUnit ?? 0), 0);
  const issuedToday = txns.filter((t) => t.type === "issue").reduce((a, t) => a + t.quantity, 0);

  const categoryLabel = (c: string) => c.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

  const summary = [
    { label: t("Item types", "أنواع الأصناف"), value: String(items.length), icon: <Package className="h-4 w-4" />, color: "text-sky-600 dark:text-sky-400" },
    { label: t("Total units in stock", "إجمالي الوحدات بالمخزون"), value: totalStock.toLocaleString(), icon: <Package className="h-4 w-4" />, color: "text-teal-600 dark:text-teal-400" },
    { label: t("Low stock items", "الأصناف منخفضة المخزون"), value: String(lowStock.length), icon: <AlertTriangle className="h-4 w-4" />, color: "text-amber-600 dark:text-amber-400" },
    { label: t("Stock value", "قيمة المخزون"), value: `$${totalValue.toLocaleString()}`, icon: <DollarSign className="h-4 w-4" />, color: "text-violet-600 dark:text-violet-400" },
  ];

  return (
    <div>
      <PageHeader title="PPE Inventory" description="Personal protective equipment stock levels across categories">
        {canManage && (
          <div className="flex gap-2">
            <Link href="/inventory/transactions/new">
              <Button variant="outline">
                <ArrowDownUp className="h-4 w-4" />
                {t("New Transaction", "معاملة جديدة")}
              </Button>
            </Link>
            <Link href="/inventory/new">
              <Button>
                <Plus className="h-4 w-4" />
                {t("Add Item", "إضافة عنصر")}
              </Button>
            </Link>
          </div>
        )}
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-start justify-between p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-2xl font-bold">{s.value}</p>
              </div>
              <div className={`rounded-lg bg-muted p-2 ${s.color}`}>{s.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>{t("Stock levels", "مستويات المخزون")}</CardTitle>
            <CardDescription>{t("Available vs issued for each PPE item", "المتاح مقابل المصروف لكل صنف من معدات الوقاية الشخصية")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className="font-medium">{t("Item", "العنصر")}</TableCell>
                  <TableCell className="font-medium">{t("Category", "الفئة")}</TableCell>
                  <TableCell className="font-medium">{t("Total", "الإجمالي")}</TableCell>
                  <TableCell className="font-medium">{t("Issued", "المصروف")}</TableCell>
                  <TableCell className="font-medium">{t("Available", "المتاح")}</TableCell>
                  <TableCell className="font-medium">{t("Level", "المستوى")}</TableCell>
                  {canManage && <TableCell className="font-medium">{t("Actions", "إجراءات")}</TableCell>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const low = item.available < item.minReorderLevel;
                  const pct = item.totalStock > 0 ? (item.available / item.totalStock) * 100 : 0;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.photoUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.photoUrl} alt={item.name} className="h-9 w-9 shrink-0 rounded-md border object-cover" />
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-xs text-muted-foreground">{item.brand ?? item.storageLocation ?? item.unit}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">{categoryLabel(item.category)}</TableCell>
                      <TableCell>{item.totalStock}</TableCell>
                      <TableCell className="text-muted-foreground">{item.issued}</TableCell>
                      <TableCell>
                        <span className={low ? "font-bold text-red-600 dark:text-red-400" : "font-medium text-emerald-600 dark:text-emerald-400"}>
                          {item.available}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        <Progress
                          value={pct}
                          indicatorClassName={low ? "bg-red-500" : pct < 50 ? "bg-amber-500" : "bg-emerald-500"}
                        />
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          <Link href={`/inventory/${item.id}/edit`} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input hover:bg-accent">
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("Low stock alerts", "تنبيهات انخفاض المخزون")}</CardTitle>
            <CardDescription>{t("Items below reorder level", "الأصناف التي تقل عن حد إعادة الطلب")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStock.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("All items above reorder levels.", "جميع الأصناف أعلى من حد إعادة الطلب.")}</p>
            )}
            {lowStock.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/5 p-2.5">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{t("Reorder at", "إعادة الطلب عند")} {item.minReorderLevel} {t("units", "وحدات")}</p>
                </div>
                <Badge variant="destructive">{item.available} {t("left", "متبقي")}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>{t("Recent transactions", "أحدث حركات المعاملات")}</CardTitle>
            <CardDescription>{t("Latest issues, receipts, and returns", "أحدث عمليات الصرف والاستلام والإرجاع")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className="font-medium">{t("Date", "التاريخ")}</TableCell>
                  <TableCell className="font-medium">{t("Item", "العنصر")}</TableCell>
                  <TableCell className="font-medium">{t("Type", "النوع")}</TableCell>
                  <TableCell className="font-medium">{t("Qty", "الكمية")}</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txns.map((txn) => {
                  const item = itemMap.get(txn.ppeItemId);
                  const isIssue = txn.type === "issue";
                  return (
                    <TableRow key={txn.id}>
                      <TableCell className="text-xs">{formatDate(txn.date, locale)}</TableCell>
                      <TableCell>{item?.name ?? t("Unknown item", "عنصر غير معروف")}</TableCell>
                      <TableCell>
                        <Badge variant={isIssue ? "warning" : "info"}>
                          <ArrowDownUp className="h-3 w-3" />
                          {txn.type}
                        </Badge>
                      </TableCell>
                      <TableCell className={isIssue ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}>
                        {isIssue ? "−" : "+"}{txn.quantity}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}