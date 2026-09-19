import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, teamMembers, workPermits, findings } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { PROJECT_STATUS_META } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus, MapPin, CalendarRange, Users } from "lucide-react";

export default async function ProjectsPage() {
  await requirePermission("team:view");
  const t = await getT();
  const locale = await getLocale();
  const tenant = await getCurrentTenant();
  const tenantId = tenant.id;

  const projectRows = db.select().from(projects).where(eq(projects.tenantId, tenantId)).all();
  const memberRows = db.select().from(teamMembers).where(eq(teamMembers.tenantId, tenantId)).all();
  const permitRows = db.select().from(workPermits).where(eq(workPermits.tenantId, tenantId)).all();
  const findingRows = db.select().from(findings).where(eq(findings.tenantId, tenantId)).all();

  const memberCountByProject = memberRows.reduce<Record<string, number>>((acc, m) => {
    if (m.projectId) acc[m.projectId] = (acc[m.projectId] ?? 0) + 1;
    return acc;
  }, {});

  const permitCountByProject = permitRows.reduce<Record<string, number>>((acc, p) => {
    if (p.projectId) acc[p.projectId] = (acc[p.projectId] ?? 0) + 1;
    return acc;
  }, {});

  const findingCountByProject = findingRows.reduce<Record<string, number>>((acc, f) => {
    if (f.projectId) acc[f.projectId] = (acc[f.projectId] ?? 0) + 1;
    return acc;
  }, {});

  const managerById = new Map(
    memberRows.filter((m) => m.jobTitle === "HSE Manager").map((m) => [m.id, m])
  );

  return (
    <div>
      <PageHeader title="Projects" description="Active HSE projects under this company">
        <Link href="/projects/new">
          <Button>
            <Plus className="h-4 w-4" />
            {t("New Project", "مشروع جديد")}
          </Button>
        </Link>
      </PageHeader>

      {projectRows.length === 0 && (
        <p className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          {t("No projects yet. Create one to start tracking HSE data.", "لا توجد مشاريع بعد. أنشئ مشروعًا للبدء بتتبع بيانات السلامة.")}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {projectRows.map((p) => {
          const meta = PROJECT_STATUS_META[p.status];
          const hseManager = p.hseManagerId ? managerById.get(p.hseManagerId) : null;
          return (
            <Card key={p.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold">{p.name}</p>
                      {p.code && <span className="font-mono text-xs text-muted-foreground">{p.code}</span>}
                    </div>
                    {p.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                  </div>
                  <Badge variant="outline" style={{ borderColor: meta?.color, color: meta?.color }}>
                    {meta ? t(meta.label, meta.labelAr) : p.status}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted p-2">
                    <p className="text-lg font-bold">{findingCountByProject[p.id] ?? 0}</p>
                    <p className="text-xs text-muted-foreground">{t("Findings", "الملاحظات")}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <p className="text-lg font-bold">{permitCountByProject[p.id] ?? 0}</p>
                    <p className="text-xs text-muted-foreground">{t("Permits", "التصاريح")}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <p className="text-lg font-bold">{memberCountByProject[p.id] ?? 0}</p>
                    <p className="text-xs text-muted-foreground">{t("Team", "الفريق")}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  {p.location && (
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {p.location}
                    </p>
                  )}
                  {p.startDate && (
                    <p className="flex items-center gap-1.5">
                      <CalendarRange className="h-3.5 w-3.5" />
                      {formatDate(p.startDate, locale)}
                      {p.endDate ? ` — ${formatDate(p.endDate, locale)}` : ""}
                    </p>
                  )}
                  {hseManager && (
                    <p className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {t("HSE Manager:", "مدير السلامة:")} {hseManager.name}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}