import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { incidents, projects, teamMembers } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { can } from "@/lib/permissions";
import { getCurrentTenant } from "@/lib/tenant";
import { getT, getLocale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { INCIDENT_TYPE_META } from "@/lib/constants";
import { deleteIncident } from "@/app/(dashboard)/incidents/actions";
import { Pencil, MapPin, User, CalendarDays, Clock3, Camera, Trash2 } from "lucide-react";
import Link from "next/link";

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const locale = await getLocale();
  const user = await requirePermission("incidents:view");
  const tenant = await getCurrentTenant();
  const { id } = await params;
  const canEdit = can(user.role as never, "incidents:edit");
  const canDelete = can(user.role as never, "incidents:delete");

  const incident = db.select().from(incidents).where(eq(incidents.id, id)).get();
  if (!incident || incident.tenantId !== tenant.id) notFound();

  const [project, reportedBy] = await Promise.all([
    incident.projectId ? db.select().from(projects).where(eq(projects.id, incident.projectId)).get() : null,
    incident.reportedById ? db.select().from(teamMembers).where(eq(teamMembers.id, incident.reportedById)).get() : null,
  ]);

  const meta = INCIDENT_TYPE_META[incident.incidentType];
  const details: { label: string; value: string | number | null }[] = [
    { label: t("Incident No.", "رقم الحادثة"), value: incident.incidentNo },
    { label: t("Project", "المشروع"), value: project?.name ?? null },
    { label: t("Location", "الموقع"), value: incident.location },
    { label: t("Person involved", "الشخص المعني"), value: incident.personName },
    { label: t("Company", "الشركة"), value: incident.personCompany },
    { label: t("Job title", "المسمى الوظيفي"), value: incident.jobTitle },
    { label: t("Age / Gender", "العمر / الجنس"), value: incident.age ? `${incident.age} / ${incident.gender ?? "—"}` : incident.gender ?? null },
    { label: t("Body part", "جزء الجسم"), value: incident.bodyPart },
    { label: t("Nature of injury", "طبيعة الإصابة"), value: incident.natureOfInjury },
    { label: t("Cause", "السبب"), value: incident.cause },
    { label: t("Immediate action", "الإجراء الفوري"), value: incident.immediateAction },
    { label: t("Lost days", "أيام العمل المفقودة"), value: incident.lostDays },
    { label: t("Restricted days", "أيام العمل المقيد"), value: incident.restrictedDays },
    { label: t("Medical cost", "تكلفة العلاج الطبي"), value: incident.medicalTreatmentCost ? `$${incident.medicalTreatmentCost.toLocaleString()}` : null },
    { label: t("Property damage", "أضرار بالممتلكات"), value: incident.propertyDamageCost ? `$${incident.propertyDamageCost.toLocaleString()}` : null },
    { label: t("Reported by", "أبلغ عنها بواسطة"), value: reportedBy?.name ?? null },
    { label: t("Status", "الحالة"), value: incident.status },
  ];

  return (
    <div>
      <PageHeader title={incident.description.length > 70 ? `${incident.description.slice(0, 70)}…` : incident.description} description={`Incident ${incident.incidentNo}`}>
        <div className="flex gap-2">
          <Badge variant="outline" style={{ borderColor: meta?.color, color: meta?.color }}>
            {t(meta?.label ?? incident.incidentType, meta?.labelAr ?? meta?.label ?? incident.incidentType)}
          </Badge>
          {canEdit && (
            <Link href={`/incidents/${incident.id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-3.5 w-3.5" />
                {t("Edit", "تعديل")}
              </Button>
            </Link>
          )}
          {canDelete && (
            <form action={deleteIncident}>
              <input type="hidden" name="id" value={incident.id} />
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
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {formatDate(incident.date, locale)}
                </span>
                {incident.time && (
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3 w-3" />
                    {incident.time}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{incident.description}</p>
            </CardContent>
          </Card>

          {incident.investigation && (
            <Card>
              <CardHeader>
                <CardTitle>{t("Investigation", "التحقيق")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{incident.investigation}</p>
              </CardContent>
            </Card>
          )}

          {incident.rootCause && (
            <Card>
              <CardHeader>
                <CardTitle>{t("Root cause", "السبب الجذري")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{incident.rootCause}</p>
              </CardContent>
            </Card>
          )}

          {incident.correctiveActions && (
            <Card>
              <CardHeader>
                <CardTitle>{t("Corrective actions", "الإجراءات التصحيحية")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {incident.correctiveActions.split("\n").filter(Boolean).map((a, i) => (
                    <Badge key={i} variant="secondary">{a}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {incident.photoUrls && incident.photoUrls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  {t("Photos", "الصور")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {incident.photoUrls.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt={t(`Incident photo ${i + 1}`, `صورة الحادثة ${i + 1}`)} className="aspect-video w-full rounded-lg object-cover" />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("Details", "التفاصيل")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {details.filter((d) => d.value != null).map((d) => (
              <div key={d.label}>
                <p className="text-xs text-muted-foreground">{d.label}</p>
                <p className="text-sm capitalize">{d.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}