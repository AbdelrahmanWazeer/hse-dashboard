import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  findings,
  incidents,
  manhours,
  manpower,
  tbtRecords,
  inductions,
  trainings,
  workPermits,
  ppeItems,
} from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Aggregation helpers
// ---------------------------------------------------------------------------

export function sumByMonth<T extends { date: number }>(rows: T[], getValue: (r: T) => number, label: string, year?: number) {
  const buckets = new Map<string, { label: string; value: number }>();
  for (let m = 0; m < 12; m++) {
    const key = `${(year ?? new Date().getFullYear())}-${String(m + 1).padStart(2, "0")}`;
    buckets.set(key, { label: labelOf(m), value: 0 });
  }
  for (const r of rows) {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const b = buckets.get(key);
    if (b) b.value += getValue(r);
  }
  return Array.from(buckets.values()).map((b, i) => ({ month: i, ...b }));
}

function labelOf(monthIndex: number) {
  return new Date(2026, monthIndex, 1).toLocaleDateString("en-US", { month: "short" });
}

export function cumulative<T>(rows: { label: string; value: number }[], key: string) {
  let acc = 0;
  return rows.map((r) => {
    acc += r.value;
    return { ...r, [key]: acc };
  });
}

export type IncidentBucket = {
  label: string;
  count: number;
  cumulative: number;
};

export type MonthlySerie = {
  month: number;
  label: string;
  value: number;
};

// ---------------------------------------------------------------------------
// Dashboard metrics
// ---------------------------------------------------------------------------

export async function getYTDStats(tenantId: string, year?: number) {
  const y = year ?? new Date().getFullYear();
  const start = new Date(y, 0, 1).getTime();
  const end = new Date(y + 1, 0, 1).getTime();

  const [mhRows, mpRows, incRows, fndRows, tbtRows, indRows, trnRows, permitRows] = await Promise.all([
    db.select().from(manhours).where(and(eq(manhours.tenantId, tenantId), gte(manhours.date, start), lte(manhours.date, end))).all(),
    db.select().from(manpower).where(and(eq(manpower.tenantId, tenantId), gte(manpower.date, start), lte(manpower.date, end))).all(),
    db.select().from(incidents).where(and(eq(incidents.tenantId, tenantId), gte(incidents.date, start), lte(incidents.date, end))).all(),
    db.select().from(findings).where(and(eq(findings.tenantId, tenantId), gte(findings.createdAt, start), lte(findings.createdAt, end))).all(),
    db.select().from(tbtRecords).where(and(eq(tbtRecords.tenantId, tenantId), gte(tbtRecords.date, start), lte(tbtRecords.date, end))).all(),
    db.select().from(inductions).where(and(eq(inductions.tenantId, tenantId), gte(inductions.date, start), lte(inductions.date, end))).all(),
    db.select().from(trainings).where(and(eq(trainings.tenantId, tenantId), gte(trainings.date, start), lte(trainings.date, end))).all(),
    db.select().from(workPermits).where(and(eq(workPermits.tenantId, tenantId), gte(workPermits.createdAt, start), lte(workPermits.createdAt, end))).all(),
  ]);

  const totalManhours = mhRows.reduce((a, r) => a + r.manhours, 0);
  const maxHeadcount = mpRows.reduce((a, r) => Math.max(a, r.headcount), 0);

  const byType: Record<string, number> = {};
  for (const i of incRows) byType[i.incidentType] = (byType[i.incidentType] ?? 0) + 1;
  const totalIncidents = incRows.length;

  const ltiCount = byType["lti"] ?? 0;
  const recordable = (byType["lti"] ?? 0) + (byType["medical_treatment"] ?? 0) + (byType["restricted_work"] ?? 0);
  const ltir = totalManhours > 0 ? ((ltiCount * 200000) / totalManhours) : 0;
  const trir = totalManhours > 0 ? ((recordable * 200000) / totalManhours) : 0;
  const firstAid = byType["first_aid"] ?? 0;
  const nearMiss = byType["near_miss"] ?? 0;
  const fatality = byType["fatality"] ?? 0;

  const openFindings = fndRows.filter((f) => f.status === "open" || f.status === "in_progress" || f.status === "overdue").length;
  const closedFindings = fndRows.filter((f) => f.status === "closed").length;
  const criticalFindings = fndRows.filter((f) => f.severity === "critical" && f.status !== "closed").length;

  const activePermits = permitRows.filter((p) => p.status === "active").length;

  const totalTBT = tbtRows.reduce((a, r) => a + r.attendees, 0);
  const tbtSessions = tbtRows.length;

  return {
    year: y,
    totalManhours,
    maxHeadcount,
    totalIncidents,
    byType,
    ltiCount,
    recordable,
    ltir,
    trir,
    firstAid,
    nearMiss,
    fatality,
    openFindings,
    closedFindings,
    criticalFindings,
    activePermits,
    totalTBT,
    tbtSessions,
    totalInductions: indRows.length,
    totalTrainings: trnRows.length,
  };
}

export async function getMonthlySeries(tenantId: string, year?: number) {
  const y = year ?? new Date().getFullYear();
  const [mhRows, mpRows, incRows, fndRows] = await Promise.all([
    db.select({ date: manhours.date, manhours: manhours.manhours }).from(manhours).where(eq(manhours.tenantId, tenantId)).all(),
    db.select({ date: manpower.date, headcount: manpower.headcount }).from(manpower).where(eq(manpower.tenantId, tenantId)).all(),
    db.select({ date: incidents.date, type: incidents.incidentType }).from(incidents).where(eq(incidents.tenantId, tenantId)).all(),
    db.select({ date: findings.createdAt, severity: findings.severity }).from(findings).where(eq(findings.tenantId, tenantId)).all(),
  ]);

  const manhourSeries = sumByMonth(mhRows, (r) => r.manhours, "Manhours", y);
  const headcountSeries = sumByMonth(mpRows, (r) => r.headcount, "Manpower", y);
  const incidentSeries = sumByMonth(incRows, () => 1, "Incidents", y);
  const fatalitySeries = sumByMonth(incRows.filter((r) => r.type === "fatality"), () => 1, "Fatalities", y);
  const ltiSeries = sumByMonth(incRows.filter((r) => r.type === "lti"), () => 1, "LTIs", y);
  const findingSeries = sumByMonth(fndRows, () => 1, "Findings", y);

  const incidentCumulative = cumulative(incidentSeries, "cumulative");

  return {
    manhours: manhourSeries.map((s) => ({ month: s.month, label: s.label, manhours: s.value })),
    manpower: headcountSeries.map((s) => ({ month: s.month, label: s.label, manpower: Math.round(s.value / 30) })),
    incidents: incidentCumulative,
    lti: ltiSeries.map((s) => ({ month: s.month, label: s.label, count: s.value })),
    fatalities: fatalitySeries.map((s) => ({ month: s.month, label: s.label, count: s.value })),
    findings: findingSeries.map((s) => ({ month: s.month, label: s.label, count: s.value })),
  };
}

export async function getIncidentBreakdown(tenantId: string, year?: number) {
  const y = year ?? new Date().getFullYear();
  const start = new Date(y, 0, 1).getTime();
  const end = new Date(y + 1, 0, 1).getTime();
  const rows = db
    .select({
      type: incidents.incidentType,
      projectId: incidents.projectId,
      lostDays: incidents.lostDays,
      restrictedDays: incidents.restrictedDays,
      isLTI: incidents.isLTI,
    })
    .from(incidents)
    .where(and(eq(incidents.tenantId, tenantId), gte(incidents.date, start), lte(incidents.date, end)))
    .all();

  const byType: Record<string, { count: number; lostDays: number; restrictedDays: number }> = {};
  for (const r of rows) {
    const cur = (byType[r.type] ??= { count: 0, lostDays: 0, restrictedDays: 0 });
    cur.count++;
    cur.lostDays += r.lostDays ?? 0;
    cur.restrictedDays += r.restrictedDays ?? 0;
  }

  const totalLostDays = rows.reduce((a, r) => a + (r.lostDays ?? 0), 0);
  const totalRestrictedDays = rows.reduce((a, r) => a + (r.restrictedDays ?? 0), 0);
  const totalIncidents = rows.length;

  return { byType, totalLostDays, totalRestrictedDays, totalIncidents };
}

export async function getTrainingStats(tenantId: string) {
  const rows = db.select().from(trainings).where(eq(trainings.tenantId, tenantId)).all();
  const now = Date.now();
  const valid = rows.filter((r) => r.expiryDate == null || r.expiryDate > now + 90 * 86400000).length;
  const expiring = rows.filter((r) => r.expiryDate != null && r.expiryDate > now && r.expiryDate <= now + 90 * 86400000).length;
  const expired = rows.filter((r) => r.expiryDate != null && r.expiryDate <= now).length;
  return { total: rows.length, valid, expiring, expired };
}

export async function getInventoryStats(tenantId: string) {
  const rows = db.select().from(ppeItems).where(eq(ppeItems.tenantId, tenantId)).all();
  const totalStock = rows.reduce((a, r) => a + r.totalStock, 0);
  const totalAvailable = rows.reduce((a, r) => a + r.available, 0);
  const lowStock = rows.filter((r) => r.available < r.minReorderLevel).length;
  const totalValue = rows.reduce((a, r) => a + r.available * (r.pricePerUnit ?? 0), 0);
  return { totalItems: rows.length, totalStock, totalAvailable, lowStock, totalValue };
}

export async function rankProjectCost(tenantId: string): Promise<{ projectId: string; incidents: number }[]> {
  const rows = db.select({ projectId: incidents.projectId, id: incidents.id }).from(incidents).where(eq(incidents.tenantId, tenantId)).all();
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.projectId ?? "unassigned", (map.get(r.projectId ?? "unassigned") ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([projectId, incidents]) => ({ projectId, incidents })).sort((a, b) => b.incidents - a.incidents);
}