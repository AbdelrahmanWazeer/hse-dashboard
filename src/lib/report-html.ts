import { INCIDENT_TYPE_META } from "@/lib/constants";
import { reports } from "@/lib/db/schema";

type ReportRow = typeof reports.$inferSelect;

type ReportData = {
  year?: number;
  month?: number;
  generatedAt?: number;
  generatedBy?: string | null;
  stats?: {
    totalManhours?: number;
    totalIncidents?: number;
    ltiCount?: number;
    recordable?: number;
    ltir?: number;
    trir?: number;
    firstAid?: number;
    nearMiss?: number;
    openFindings?: number;
    closedFindings?: number;
    totalTBT?: number;
    tbtSessions?: number;
    totalInductions?: number;
    totalTrainings?: number;
    activePermits?: number;
  };
  breakdown?: {
    byType?: Record<string, { count: number; lostDays: number; restrictedDays: number }>;
    totalLostDays?: number;
    totalRestrictedDays?: number;
    totalIncidents?: number;
  };
  training?: { total?: number; valid?: number; expiring?: number; expired?: number };
};

export function reportStats(report: ReportRow): ReportData {
  return (report.data ?? {}) as ReportData;
}

function incidentBarChart(byType: Record<string, { count: number; lostDays: number; restrictedDays: number }>): string {
  const entries = Object.entries(byType);
  if (entries.length === 0) return "";
  const max = Math.max(...entries.map(([, v]) => v.count), 1);
  const bars = entries
    .map(
      ([type, v]) =>
        `<div style="display:flex;align-items:center;gap:8px;margin:6px 0;">
          <div style="width:140px;font-size:12px;color:#475569;text-align:right;">${INCIDENT_TYPE_META[type]?.label ?? type}</div>
          <div style="flex:1;background:#e2e8f0;border-radius:4px;height:16px;">
            <div style="width:${((v.count / max) * 100).toFixed(1)}%;background:#0f766e;height:16px;border-radius:4px;"></div>
          </div>
          <div style="width:32px;font-size:12px;font-weight:600;">${v.count}</div>
        </div>`
    )
    .join("");
  return `<h2>Incidents by type</h2>${bars}`;
}

export function renderReportHtml(report: ReportRow, tenantName: string): string {
  const data = reportStats(report);
  const s = data.stats ?? {};
  const byType = data.breakdown?.byType ?? {};

  const rows = Object.entries(byType)
    .map(
      ([type, v]) =>
        `<tr><td>${INCIDENT_TYPE_META[type]?.label ?? type}</td><td>${v.count}</td><td>${v.lostDays}</td><td>${v.restrictedDays}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${report.title}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 40px auto; max-width: 900px; padding: 0 24px; line-height: 1.5; }
  h1 { font-size: 24px; margin: 8px 0 4px; }
  h2 { font-size: 18px; margin: 28px 0 12px; border-bottom: 2px solid #0f766e; padding-bottom: 6px; }
  .brand { text-transform: uppercase; letter-spacing: 2px; font-size: 12px; color: #64748b; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 12px; }
  .stat { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
  .stat .v { font-size: 20px; font-weight: 700; }
  .stat .l { font-size: 12px; color: #64748b; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 8px; }
  th { text-align: left; text-transform: uppercase; font-size: 11px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 8px; }
  td { border-bottom: 1px solid #e2e8f0; padding: 8px; }
  .foot { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
  <p class="brand">HSE Dashboard &mdash; ${tenantName}</p>
  <h1>${report.title}</h1>
  <p style="color:#64748b">Reporting period: ${report.startDate ? new Date(report.startDate).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : ""}</p>

  <h2>Executive summary</h2>
  <div class="grid">
    <div class="stat"><div class="v">${(s.totalManhours ?? 0).toLocaleString()}</div><div class="l">Man-hours</div></div>
    <div class="stat"><div class="v">${s.totalIncidents ?? 0}</div><div class="l">Incidents</div></div>
    <div class="stat"><div class="v">${s.ltiCount ?? 0}</div><div class="l">LTI</div></div>
    <div class="stat"><div class="v">${(s.ltir ?? 0).toFixed(2)}</div><div class="l">LTI Rate</div></div>
    <div class="stat"><div class="v">${s.openFindings ?? 0}</div><div class="l">Open findings</div></div>
    <div class="stat"><div class="v">${(s.totalTBT ?? 0).toLocaleString()}</div><div class="l">TBT attendees</div></div>
    <div class="stat"><div class="v">${s.totalInductions ?? 0}</div><div class="l">Inductions</div></div>
    <div class="stat"><div class="v">${s.activePermits ?? 0}</div><div class="l">Active permits</div></div>
  </div>

  ${incidentBarChart(byType)}

  <h2>Incident breakdown</h2>
  <table>
    <thead><tr><th>Type</th><th>Count</th><th>Lost days</th><th>Restricted days</th></tr></thead>
    <tbody>${rows || "<tr><td colspan=4>No incidents recorded.</td></tr>"}</tbody>
  </table>

  <div class="foot">Generated by HSE Dashboard &middot; ${new Date().toLocaleString()}</div>
</body>
</html>`;
}