import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { workPermits, siteLayouts, projects } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { PermitMapLoader } from "@/components/permits/permit-map-loader";
import { MapPin } from "lucide-react";

export default async function PermitMapPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("permits:view");
  const t = await getT();
  const locale = await getLocale();
  const tenant = await getCurrentTenant();
  const { project } = await searchParams;
  const projectId = typeof project === "string" && project !== "" ? project : undefined;

  const allProjects = db.select().from(projects).where(eq(projects.tenantId, tenant.id)).all();

  let permits = db.select().from(workPermits).where(eq(workPermits.tenantId, tenant.id)).all();
  if (projectId) {
    permits = permits.filter((p) => p.projectId === projectId);
  }
  const withCoords = permits.filter((p) => p.locationX != null && p.locationY != null);

  const layout = db.select().from(siteLayouts).where(eq(siteLayouts.tenantId, tenant.id)).all().find((l) => l.isActive) ?? null;

  const projectName = projectId ? allProjects.find((p) => p.id === projectId)?.name ?? null : null;

  const markers = withCoords.map((p) => ({
    id: p.id,
    permitNo: p.permitNo,
    title: p.title,
    permitType: p.permitType,
    status: p.status,
    x: p.locationX!,
    y: p.locationY!,
    location: p.location,
  }));

  return (
    <div>
      <PageHeader title="Permit Site Map" description="Live view of work permit locations across the site">
        <form method="GET" className="flex items-center gap-2">
          <Select name="project" defaultValue={projectId ?? "all"} className="w-52">
            <option value="all">{t("All projects", "جميع المشاريع")}</option>
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            <MapPin className="h-4 w-4" />
            {t("Apply", "تطبيق")}
          </button>
        </form>
      </PageHeader>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{projectName ? `${projectName} — ${t("Active Locations", "المواقع النشطة")}` : t("All Sites", "جميع المواقع")}</CardTitle>
          <CardDescription>
            {t(
              `${withCoords.length} permit${withCoords.length === 1 ? "" : "s"} plotted · ${permits.length - withCoords.length} without coordinates`,
              `${withCoords.length} تصريح${withCoords.length === 1 ? "" : "ات"} مُوضع · ${permits.length - withCoords.length} بدون إحداثيات`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PermitMapLoader permits={markers} layout={layout ? { imageUrl: layout.imageUrl, width: layout.width ?? 100, height: layout.height ?? 70 } : null} projectName={projectName ?? undefined} />
        </CardContent>
      </Card>
    </div>
  );
}