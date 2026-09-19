import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { incidents, projects } from "@/lib/db/schema";
import { requirePermission } from "@/lib/guards";
import { getCurrentTenant } from "@/lib/tenant";
import { PageHeader } from "@/components/page-header";
import { IncidentForm } from "@/components/incidents/incident-form";

export default async function EditIncidentPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("incidents:edit");
  const tenant = await getCurrentTenant();
  const { id } = await params;

  const incident = db.select().from(incidents).where(eq(incidents.id, id)).get();
  if (!incident || incident.tenantId !== tenant.id) notFound();

  const projectRows = db.select().from(projects).where(eq(projects.tenantId, tenant.id)).all();

  return (
    <div>
      <PageHeader title="Edit Incident" description={`${incident.incidentNo} · ${incident.personName ?? incident.incidentType}`} />
      <IncidentForm
        projects={projectRows.map((p) => ({ id: p.id, name: p.name }))}
        initial={{
          id: incident.id,
          projectId: incident.projectId,
          incidentType: incident.incidentType,
          date: incident.date,
          time: incident.time,
          location: incident.location,
          description: incident.description,
          personName: incident.personName,
          personCompany: incident.personCompany,
          jobTitle: incident.jobTitle,
          age: incident.age,
          gender: incident.gender,
          bodyPart: incident.bodyPart,
          natureOfInjury: incident.natureOfInjury,
          cause: incident.cause,
          immediateAction: incident.immediateAction,
          investigation: incident.investigation,
          rootCause: incident.rootCause,
          correctiveActions: incident.correctiveActions,
          lostDays: incident.lostDays ?? 0,
          restrictedDays: incident.restrictedDays ?? 0,
          medicalTreatmentCost: incident.medicalTreatmentCost,
          propertyDamageCost: incident.propertyDamageCost,
          status: incident.status,
          photoUrls: incident.photoUrls ?? [],
        }}
      />
    </div>
  );
}