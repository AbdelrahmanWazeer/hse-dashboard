import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { findings, projects, teamMembers, users } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { can } from "@/lib/permissions";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { FINDING_SEVERITY_META, FINDING_STATUS_META } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/utils";
import { deleteFinding } from "@/app/(dashboard)/findings/actions";
import {
  Pencil,
  MapPin,
  User,
  CalendarDays,
  Flag,
  Camera,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import Link from "next/link";

export default async function FindingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const locale = await getLocale();
  const user = await requirePermission("findings:view");
  const tenant = await getCurrentTenant();
  const { id } = await params;
  const canEdit = can(user.role as never, "findings:edit");
  const canDelete = can(user.role as never, "findings:delete");

  const finding = db
    .select()
    .from(findings)
    .where(eq(findings.id, id))
    .get();

  if (!finding || finding.tenantId !== tenant.id) notFound();

  const [project, reportedBy, assignedTo, closedBy] = await Promise.all([
    finding.projectId ? db.select().from(projects).where(eq(projects.id, finding.projectId)).get() : null,
    finding.reportedById ? db.select().from(teamMembers).where(eq(teamMembers.id, finding.reportedById)).get() : null,
    finding.assignedToId ? db.select().from(teamMembers).where(eq(teamMembers.id, finding.assignedToId)).get() : null,
    finding.closedById ? db.select().from(users).where(eq(users.id, finding.closedById)).get() : null,
  ]);

  const severityMeta = FINDING_SEVERITY_META[finding.severity];
  const statusMeta = FINDING_STATUS_META[finding.status];

  const detailRows = [
    { label: t("Finding No.", "رقم الملاحظة"), value: finding.findingNo, icon: <Flag className="h-4 w-4" /> },
    { label: t("Category", "الفئة"), value: finding.category.replace(/_/g, " "), icon: null },
    { label: t("Location", "الموقع"), value: finding.location ?? "—", icon: <MapPin className="h-4 w-4" /> },
    { label: t("Project", "المشروع"), value: project?.name ?? "—", icon: null },
    { label: t("Reported by", "أبلغ بها"), value: reportedBy?.name ?? "—", icon: <User className="h-4 w-4" /> },
    { label: t("Assigned to", "المسؤول"), value: assignedTo?.name ?? "—", icon: <User className="h-4 w-4" /> },
    {
      label: t("Reported on", "تاريخ الإبلاغ"),
      value: formatDate(finding.createdAt, locale),
      icon: <CalendarDays className="h-4 w-4" />,
    },
    {
      label: t("Due date", "تاريخ الاستحقاق"),
      value: finding.dueDate ? formatDate(finding.dueDate, locale) : "—",
      icon: <CalendarDays className="h-4 w-4" />,
    },
    {
      label: t("Closed on", "تاريخ الإغلاق"),
      value: finding.closedAt ? formatDate(finding.closedAt, locale) : "—",
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    { label: t("Closed by", "أغلقها"), value: closedBy?.name ?? "—", icon: null },
  ];

  return (
    <div>
      <PageHeader title={finding.title} description={`Finding ${finding.findingNo}`}>
        <div className="flex gap-2">
          <Badge variant="outline" style={{ borderColor: severityMeta?.color, color: severityMeta?.color }}>
            {t(
              `${severityMeta?.label ?? finding.severity} severity`,
              `${severityMeta?.labelAr ?? severityMeta?.label ?? finding.severity} الخطورة`
            )}
          </Badge>
          <Badge variant="outline" style={{ borderColor: statusMeta?.color, color: statusMeta?.color }}>
            {t(statusMeta?.label ?? finding.status, statusMeta?.labelAr ?? statusMeta?.label ?? finding.status)}
          </Badge>
          {canEdit && (
            <Link href={`/findings/${finding.id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-3.5 w-3.5" />
                {t("Edit", "تعديل")}
              </Button>
            </Link>
          )}
          {canDelete && (
            <form action={deleteFinding}>
              <input type="hidden" name="id" value={finding.id} />
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
                {t("Delete", "حذف")}
              </Button>
            </form>
          )}
        </div>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("Description", "الوصف")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{finding.description}</p>
            </CardContent>
          </Card>

          {finding.rootCause || finding.correctiveAction ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("Root cause & corrective action", "السبب الجذري والإجراء التصحيحي")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {finding.rootCause && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Root cause", "السبب الجذري")}</p>
                    <p className="text-sm">{finding.rootCause}</p>
                  </div>
                )}
                {finding.correctiveAction && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Corrective action", "إجراء تصحيحي")}</p>
                    <p className="text-sm">{finding.correctiveAction}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {finding.remarks && (
            <Card>
              <CardHeader>
                <CardTitle>{t("Remarks", "ملاحظات")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{finding.remarks}</p>
              </CardContent>
            </Card>
          )}

          {finding.photoUrls && finding.photoUrls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    {t("Photos", "الصور")}
                  </span>
                </CardTitle>
                <CardDescription>{t(`${finding.photoUrls.length} photo(s) attached`, `${finding.photoUrls.length} صورة مرفقة`)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {finding.photoUrls.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt={t(`Finding photo ${i + 1}`, `صورة الملاحظة ${i + 1}`)} className="aspect-video w-full rounded-lg object-cover" />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("Details", "التفاصيل")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {detailRows.map((r) => (
                <div key={r.label} className="flex items-start gap-2">
                  <span className="mt-0.5 text-muted-foreground">{r.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{r.label}</p>
                    <p className="text-sm capitalize">{r.value}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("Timeline", "الخط الزمني")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 border-l pl-4">
                <div className="relative">
                  <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-sky-500" />
                  <p className="text-sm font-medium">{t("Finding opened", "تم فتح الملاحظة")}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(finding.createdAt, locale)}</p>
                </div>
                {finding.status !== "open" && (
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-amber-500" />
                    <p className="text-sm font-medium">{t("Status", "الحالة")}: {finding.status.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">{t("Last updated", "آخر تحديث")} {formatDateTime(finding.updatedAt, locale)}</p>
                  </div>
                )}
                {finding.closedAt && (
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <p className="text-sm font-medium">{t("Finding closed", "تم إغلاق الملاحظة")}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(finding.closedAt, locale)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}