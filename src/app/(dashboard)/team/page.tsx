import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { teamMembers, projects, tenants, invitations, type Role } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { can, ROLE_LABELS } from "@/lib/permissions";
import { getT, getLocale } from "@/lib/i18n";
import { ROLES } from "@/lib/constants";
import { getBaseUrl } from "@/lib/url";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrgTree, type OrgNode } from "@/components/team/org-tree";
import { Avatar } from "@/components/ui/misc";
import { Plus, UserPlus, Users } from "lucide-react";
import { CopyButton } from "@/components/team/copy-button";
import { resendInvitation, revokeInvitation } from "./actions";

const NOW = Date.now();

export default async function TeamPage() {
  const t = await getT();
  const locale = await getLocale();
  const user = await requirePermission("team:view");
  const tenant = await getCurrentTenant();
  const tenantId = tenant.id;
  const baseUrl = await getBaseUrl();

  const [members, projectsRows, invites] = await Promise.all([
    db.select().from(teamMembers).where(eq(teamMembers.tenantId, tenantId)).all(),
    db.select().from(projects).where(eq(projects.tenantId, tenantId)).all(),
    db.select().from(invitations).where(eq(invitations.tenantId, tenantId)).orderBy(desc(invitations.createdAt)).all(),
  ]);

  const projectMap = new Map(projectsRows.map((p) => [p.id, p]));

  const byManager = new Map<string | null, typeof members>();
  for (const m of members) {
    const list = byManager.get(m.managerId) ?? [];
    list.push(m);
    byManager.set(m.managerId, list);
  }

  const buildNode = (m: (typeof members)[number], depth: number): OrgNode => ({
    id: m.id,
    name: m.name,
    jobTitle: m.jobTitle,
    role: m.role,
    email: m.email,
    phone: m.phone,
    avatar: m.avatar,
    projectName: m.projectId ? projectMap.get(m.projectId)?.name ?? null : null,
    children: (byManager.get(m.id) ?? []).map((c) => buildNode(c, depth + 1)),
  });

  const roots = members.filter((m) => m.managerId == null || !byManager.has(m.managerId)).map((m) => buildNode(m, 0));

  const roleCount = members.reduce<Record<string, number>>((acc, m) => {
    acc[m.role] = (acc[m.role] ?? 0) + 1;
    return acc;
  }, {});

  const roleLabelAr = Object.fromEntries(ROLES.map((r) => [r.value, r.labelAr]));

  const byProject = members.reduce<Record<string, number>>((acc, m) => {
    const name = m.projectId ? projectMap.get(m.projectId)?.name ?? t("Unassigned", "غير مخصص") : t("Unassigned", "غير مخصص");
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});

  const managers = members.filter((m) => ["HSE Manager", "HSE Senior Supervisor", "HSE Team Leader", "Section Head"].includes(m.jobTitle));

  return (
    <div>
      <PageHeader title="Team & Organization" description={`${tenant.name} — HSE organizational structure`}>
        {can(user.role as Role, "team:invite") && (
          <Link href="/team/invite" className={buttonVariants()}>
            <UserPlus className="h-4 w-4" />
            {t("Invite Member", "دعوة عضو")}
          </Link>
        )}
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">{t("Team size", "حجم الفريق")}</p>
            <p className="mt-1 text-2xl font-bold">{members.length}</p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" /> {t(`across ${projectsRows.length} projects`, `عبر ${projectsRows.length} مشاريع`)}
            </p>
          </CardContent>
        </Card>
        {(["admin", "publisher", "editor", "viewer"] as const).map((r) => (
          <Card key={r}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{t(ROLE_LABELS[r], roleLabelAr[r])}</p>
              <p className="mt-1 text-2xl font-bold">{roleCount[r] ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("account access level", "مستوى الوصول للحساب")}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>{t("Org chart", "المخطط التنظيمي")}</CardTitle>
            <CardDescription>{t("Company → Project → HSE Manager → Team", "الشركة ← المشروع ← مدير السلامة ← الفريق")}</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[560px] overflow-auto">
            <OrgTree root={roots} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{t("Leadership", "القيادة")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {managers.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 rounded-lg border p-2">
                    <Avatar name={m.name} image={m.avatar} className="h-7 w-7 text-[10px]" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{m.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.jobTitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{t("Members per project", "الأعضاء لكل مشروع")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(byProject)
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{name}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("Invitations", "الدعوات")}</CardTitle>
            <CardDescription>{t("Team members invited to join this workspace", "أعضاء الفريق المدعوون للانضمام إلى هذه المساحة")}</CardDescription>
          </CardHeader>
          <CardContent>
            {invites.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("No invitations yet.", "لا توجد دعوات بعد.")}</p>
            ) : (
              <ul className="divide-y">
                {invites.map((inv) => {
                  const active = inv.status === "pending" && inv.expiresAt >= NOW;
                  const badgeVariant =
                    inv.status === "accepted"
                      ? "success"
                      : inv.status === "revoked"
                        ? "danger"
                        : inv.status === "pending"
                          ? ("warning" as const)
                          : "outline";
                  return (
                    <li key={inv.id} className="flex flex-wrap items-center gap-3 py-3">
                      <Avatar name={inv.name} className="h-8 w-8 text-[10px]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {inv.name} <span className="font-normal text-muted-foreground">· {inv.email}</span>
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t(ROLE_LABELS[inv.role as Role], roleLabelAr[inv.role])} · {inv.jobTitle}
                        </p>
                      </div>
                      <Badge variant={badgeVariant}>{inv.status}</Badge>
                      {active && (
                        <div className="flex items-center gap-1.5">
                          <CopyButton value={`${baseUrl}/accept/${inv.token}`} />
                          <form action={resendInvitation}>
                            <input type="hidden" name="id" value={inv.id} />
                            <Button type="submit" variant="ghost" size="sm">
                              {t("Resend", "إعادة الإرسال")}
                            </Button>
                          </form>
                          <form action={revokeInvitation}>
                            <input type="hidden" name="id" value={inv.id} />
                            <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              {t("Revoke", "سحب")}
                            </Button>
                          </form>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}