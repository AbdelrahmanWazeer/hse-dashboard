import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tenants, siteLayouts, users, invitations } from "@/lib/db/schema";
import { requireUser } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { getT } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { ROLES, JOB_TITLES, DEFAULT_PPE_ITEMS } from "@/lib/constants";
import { Building2, ImageUp, KeyRound, Database, Users } from "lucide-react";

export default async function SettingsPage() {
  const t = await getT();
  const user = await requireUser();
  const tenant = await getCurrentTenant();

  const tenantRow = db.select().from(tenants).where(eq(tenants.id, tenant.id)).get();
  const myUser = db.select().from(users).where(eq(users.id, user.id)).get();
  const layouts = db.select().from(siteLayouts).where(eq(siteLayouts.tenantId, tenant.id)).all();
  const invitationRows = db.select().from(invitations).where(eq(invitations.tenantId, tenant.id)).all();

  const roleDescriptionAr: Record<string, string> = {
    admin: "وصول كامل إلى جميع الميزات والمستخدمين والإعدادات",
    editor: "يمكنه إنشاء وتعديل السجلات والمحتوى",
    publisher: "محرر + يمكنه نشر المقالات والتقارير ودعوة أعضاء الفريق",
    viewer: "وصول للقراءة فقط",
  };

  const invitationStatusAr: Record<string, string> = {
    pending: "قيد الانتظار",
    accepted: "مقبولة",
    declined: "مرفوضة",
    revoked: "ملغاة",
  };

  const planLabel =
    tenant.plan === "starter" ? t("Starter", "التأسيسية")
    : tenant.plan === "pro" ? t("Pro", "الاحترافية")
    : tenant.plan === "enterprise" ? t("Enterprise", "المؤسسية")
    : tenant.plan;

  return (
    <div>
      <PageHeader title="Settings" description={`Company settings, integrations, and account details`} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {t("Company & tenant", "الشركة والمنشأة")}
            </CardTitle>
            <CardDescription>{t("Organization profile for", "الملف التنظيمي لـ")} {tenant.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("Company name", "اسم الشركة")}</Label>
                <Input defaultValue={tenantRow?.name ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("Plan", "الباقة")}</Label>
                <Input defaultValue={planLabel} readOnly />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("Site slug", "معرّف الموقع")}</Label>
              <Input defaultValue={tenant.slug} readOnly />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{t("Primary color", "اللون الأساسي")}</p>
                <p className="text-xs text-muted-foreground">{t("Used across the dashboard theme", "يُستخدم في سمة لوحة التحكم بالكامل")}</p>
              </div>
              <input type="color" defaultValue={tenant.primaryColor} className="h-9 w-14 cursor-pointer rounded border" />
            </div>
            <Button disabled>{t("Save changes", "حفظ التغييرات")}</Button>
            <p className="text-xs text-muted-foreground">
              {t("Saving is disabled in this local demo build. Forms here show the underlying data model.", "حفظ التغييرات معطل في هذا الإصدار التجريبي المحلي. تُظهر النماذج هنا نموذج البيانات الأساسي.")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageUp className="h-4 w-4" />
              {t("Site layout (Permit Map)", "تخطيط الموقع (خريطة التصاريح)")}
            </CardTitle>
            <CardDescription>{t("Upload the site plan used to plot work permit locations", "ارفع مخطط الموقع المستخدم لتحديد مواقع تصاريح العمل")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {layouts.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{l.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.isActive ? t("Active layout", "تخطيط نشط") : t("Inactive", "غير نشط")} · {l.width ?? 100}×{l.height ?? 70}
                    </p>
                  </div>
                  <Switch checked={!!l.isActive} disabled />
                </div>
              ))}
            </div>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground hover:border-primary/50">
              <ImageUp className="h-6 w-6" />
              {t("Drop an image here or click to upload", "أسقط صورة هنا أو انقر للرفع")}
              <input type="file" accept="image/*" className="hidden" />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              {t("Security", "الأمان")}
            </CardTitle>
            <CardDescription>{t("Password & session settings", "إعدادات كلمة المرور والجلسة")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("Last signed in", "آخر تسجيل دخول")}</p>
                  <p className="text-xs text-muted-foreground">{myUser ? t("Active session", "جلسة نشطة") : t("No session data", "لا توجد بيانات جلسة")}</p>
                </div>
                <Badge variant="success">{t("Online", "متصل")}</Badge>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("Change password", "تغيير كلمة المرور")}</Label>
              <Input type="password" placeholder={t("New password", "كلمة مرور جديدة")} disabled />
            </div>
            <Button variant="outline" disabled>{t("Update password", "تحديث كلمة المرور")}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {t("Demo database", "قاعدة بيانات تجريبية")}
            </CardTitle>
            <CardDescription>{t("Local SQLite database with seeded demo data", "قاعدة بيانات SQLite محلية تحتوي بيانات تجريبية")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-lg font-bold">3</p>
                <p className="text-xs text-muted-foreground">{t("Users", "المستخدمون")}</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-lg font-bold">1</p>
                <p className="text-xs text-muted-foreground">{t("Tenant", "المنشأة")}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_PPE_ITEMS.slice(0, 8).map((p) => (
                <Badge key={p.name} variant="secondary">{p.name}</Badge>
              ))}
              {DEFAULT_PPE_ITEMS.length > 8 && (
                <Badge variant="outline">+{DEFAULT_PPE_ITEMS.length - 8} {t("more", "المزيد")}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("Reset the demo database at any time from the command line:", "أعد تعيين قاعدة البيانات التجريبية في أي وقت من سطر الأوامر:")}
              <code className="mt-1 block rounded bg-muted p-2 font-mono text-xs">npm run db:reset</code>
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("Roles & job titles", "الأدوار والمسميات الوظيفية")}
            </CardTitle>
            <CardDescription>{t("Access levels and team roles configured for invitations", "مستويات الوصول وأدوار الفريق المُعدة للدعوات")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold">{t("Access levels", "مستويات الوصول")}</p>
                <div className="space-y-2">
                  {ROLES.map((r) => (
                    <div key={r.value} className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{t(r.label, r.labelAr)}</p>
                      <p className="text-xs text-muted-foreground">{t(r.description, roleDescriptionAr[r.value] ?? r.description)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">{t("Job titles", "المسميات الوظيفية")}</p>
                <div className="flex flex-wrap gap-2">
                  {JOB_TITLES.map((j) => (
                    <Badge key={j} variant="outline">{j}</Badge>
                  ))}
                </div>
                <p className="mb-2 mt-4 text-sm font-semibold">{t("Open invitations", "الدعوات المفتوحة")}</p>
                <div className="space-y-2">
                  {invitationRows.length === 0 && (
                    <p className="text-xs text-muted-foreground">{t("No pending invitations.", "لا توجد دعوات معلقة.")}</p>
                  )}
                  {invitationRows.map((inv: typeof invitationRows[number]) => (
                    <div key={inv.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <div>
                        <p className="font-medium">{inv.name}</p>
                        <p className="text-xs text-muted-foreground">{inv.email} · {inv.jobTitle}</p>
                      </div>
                      <Badge variant={inv.status === "pending" ? "warning" : "info"}>{t(inv.status, invitationStatusAr[inv.status] ?? inv.status)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}