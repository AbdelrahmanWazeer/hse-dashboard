import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { reports, tenants } from "@/lib/db/schema";
import { requireUser } from "@/lib/guards";
import { reportStats } from "@/lib/report-html";
import { INCIDENT_TYPE_META } from "@/lib/constants";
import PptxGenJS from "pptxgenjs";

export const dynamic = "force-dynamic";

const TEAL = "0F766E";
const INK = "0F172A";
const MUTED = "64748B";
const FONT = "Arial";

type StatRow = { label: string; value: string };
type Cell = PptxGenJS.TableCell;
type Options = PptxGenJS.TableCellProps;

function cell(text: string, options?: Options): Cell {
  return { text, options };
}

function headerCell(text: string): Cell {
  return cell(text, { fill: { color: TEAL }, color: "FFFFFF", bold: true, fontSize: 13, fontFace: FONT });
}

function summaryRows(stats: {
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
}): StatRow[] {
  return [
    { label: "Man-hours", value: (stats.totalManhours ?? 0).toLocaleString() },
    { label: "Incidents", value: String(stats.totalIncidents ?? 0) },
    { label: "Lost time injuries (LTI)", value: String(stats.ltiCount ?? 0) },
    { label: "Recordable cases", value: String(stats.recordable ?? 0) },
    { label: "LTI rate", value: (stats.ltir ?? 0).toFixed(2) },
    { label: "TRIR", value: (stats.trir ?? 0).toFixed(2) },
    { label: "First aid cases", value: String(stats.firstAid ?? 0) },
    { label: "Near misses", value: String(stats.nearMiss ?? 0) },
    { label: "Open findings", value: String(stats.openFindings ?? 0) },
    { label: "Closed findings", value: String(stats.closedFindings ?? 0) },
    { label: "TBT attendees", value: (stats.totalTBT ?? 0).toLocaleString() },
    { label: "Inductions", value: String(stats.totalInductions ?? 0) },
    { label: "Trainings on file", value: String(stats.totalTrainings ?? 0) },
    { label: "Active permits", value: String(stats.activePermits ?? 0) },
  ];
}

function kvTable(rows: StatRow[]): { rows: PptxGenJS.TableRow[]; x: number; y: number; w: number; colW: number[] } {
  const table: PptxGenJS.TableRow[] = [
    [headerCell("Metric"), cell("Value", { fill: { color: TEAL }, color: "FFFFFF", bold: true, fontSize: 13, fontFace: FONT, align: "right" })],
    ...rows.map((r) => [cell(r.label, { color: MUTED, fontSize: 13, fontFace: FONT }), cell(r.value, { color: INK, bold: true, fontSize: 13, fontFace: FONT, align: "right" })]),
  ];
  return { rows: table, x: 0.6, y: 1.35, w: 12.1, colW: [8.0, 4.1] };
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await ctx.params;

  const report = db.select().from(reports).where(eq(reports.id, id)).get();
  if (!report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }
  const tenant = db.select().from(tenants).where(eq(tenants.id, report.tenantId)).get();
  const r = reportStats(report);
  const s = r.stats ?? {};
  const byType = r.breakdown?.byType ?? {};

  const period = report.startDate
    ? new Date(report.startDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : new Date(r.generatedAt ?? report.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "HSE Dashboard";
  pptx.subject = report.title;

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: TEAL };
  titleSlide.addText(
    [
      { text: "HSE DASHBOARD", options: { charSpacing: 4, fontSize: 13 } },
      { text: report.title, options: { fontSize: 32, bold: true, color: "FFFFFF", breakLine: true, align: "left" } },
      { text: `Reporting period: ${period}`, options: { fontSize: 15, color: "D9EBE8", breakLine: true } },
      { text: tenant?.name ?? "HSE", options: { fontSize: 13, color: "BFE0DB" } },
    ],
    { x: 0.7, y: 2.3, w: 12, h: 3.5, color: "FFFFFF", fontFace: FONT, align: "left", valign: "top" }
  );
  titleSlide.addText(`Generated ${new Date(r.generatedAt ?? report.createdAt).toLocaleString()}`, {
    x: 0.7,
    y: 6.9,
    w: 12,
    h: 0.4,
    fontSize: 11,
    color: "BFE0DB",
    fontFace: FONT,
  });

  // Executive summary slide
  const summarySlide = pptx.addSlide();
  summarySlide.background = { color: "FFFFFF" };
  summarySlide.addText("Executive summary", {
    x: 0.6,
    y: 0.45,
    w: 12,
    h: 0.7,
    fontSize: 24,
    bold: true,
    color: INK,
    fontFace: FONT,
  });
  const summaryTbl = kvTable(summaryRows(s));
  summarySlide.addTable(summaryTbl.rows, {
    x: summaryTbl.x,
    y: summaryTbl.y,
    w: summaryTbl.w,
    colW: summaryTbl.colW,
    border: { pt: 0.75, color: "E2E8F0" },
    fontSize: 13,
    fontFace: FONT,
    valign: "middle",
    rowH: 0.32,
    autoPage: false,
    margin: 0.08,
  });
  summarySlide.addNotes(`Monthly HSE performance metrics for ${period}.`);

  // Incident breakdown slide
  const breakdownSlide = pptx.addSlide();
  breakdownSlide.background = { color: "FFFFFF" };
  breakdownSlide.addText("Incident breakdown", {
    x: 0.6,
    y: 0.45,
    w: 12,
    h: 0.7,
    fontSize: 24,
    bold: true,
    color: INK,
    fontFace: FONT,
  });
  const incidentRows: PptxGenJS.TableRow[] = [
    [
      headerCell("Type"),
      headerCell("Count"),
      headerCell("Lost days"),
      headerCell("Restricted days"),
    ],
  ];
  if (Object.keys(byType).length === 0) {
    incidentRows.push([
      cell("No incidents recorded for this period.", { color: MUTED, fontSize: 13, fontFace: FONT }),
      cell("0", { fontSize: 13, fontFace: FONT, align: "center" }),
      cell("0", { fontSize: 13, fontFace: FONT, align: "center" }),
      cell("0", { fontSize: 13, fontFace: FONT, align: "center" }),
    ]);
  } else {
    for (const [type, v] of Object.entries(byType)) {
      incidentRows.push([
        cell(INCIDENT_TYPE_META[type]?.label ?? type, { fontSize: 13, fontFace: FONT }),
        cell(String(v.count), { bold: true, fontSize: 13, fontFace: FONT, align: "center" }),
        cell(String(v.lostDays), { fontSize: 13, fontFace: FONT, align: "center" }),
        cell(String(v.restrictedDays), { fontSize: 13, fontFace: FONT, align: "center" }),
      ]);
    }
  }
  breakdownSlide.addTable(incidentRows, {
    x: 0.6,
    y: 1.35,
    w: 12.1,
    colW: [5.8, 2.1, 2.1, 2.1],
    border: { pt: 0.75, color: "E2E8F0" },
    fontSize: 13,
    fontFace: FONT,
    valign: "middle",
    rowH: 0.4,
    autoPage: false,
    margin: 0.08,
  });

  // Incident count by type (native bar chart slide)
  const chartSlide = pptx.addSlide();
  chartSlide.background = { color: "FFFFFF" };
  chartSlide.addText("Incident count by type", {
    x: 0.6,
    y: 0.45,
    w: 12,
    h: 0.7,
    fontSize: 24,
    bold: true,
    color: INK,
    fontFace: FONT,
  });
  const chartData = [
    {
      name: "Incidents",
      labels: Object.keys(byType).map((type) => INCIDENT_TYPE_META[type]?.label ?? type),
      values: Object.entries(byType).map(([, v]) => v.count),
    },
  ];
  chartSlide.addChart("bar" as never, chartData as never, {
    x: 0.6,
    y: 1.4,
    w: 12,
    h: 4.8,
    chartColors: [TEAL],
    barDir: "bar",
    catAxisLabelColor: "475569",
    catAxisLabelFontFace: FONT,
    catAxisLabelFontSize: 12,
    valAxisLabelColor: "475569",
    valAxisLabelFontFace: FONT,
    valAxisLabelFontSize: 12,
  });

  // Safety performance slide
  const performanceSlide = pptx.addSlide();
  performanceSlide.background = { color: "FFFFFF" };
  performanceSlide.addText("Safety performance", {
    x: 0.6,
    y: 0.45,
    w: 12,
    h: 0.7,
    fontSize: 24,
    bold: true,
    color: INK,
    fontFace: FONT,
  });
  const perfRows: StatRow[] = [
    { label: "Lost time injuries", value: String(s.ltiCount ?? 0) },
    { label: "First aid cases", value: String(s.firstAid ?? 0) },
    { label: "Recordable cases", value: String(s.recordable ?? 0) },
    { label: "Findings closed", value: String(s.closedFindings ?? 0) },
    { label: "TBT sessions", value: String(s.tbtSessions ?? 0) },
    { label: "Trainings on file", value: String(s.totalTrainings ?? 0) },
    { label: "Total lost days", value: String(r.breakdown?.totalLostDays ?? 0) },
    { label: "Total restricted days", value: String(r.breakdown?.totalRestrictedDays ?? 0) },
  ];
  const perfTbl = kvTable(perfRows);
  performanceSlide.addTable(perfTbl.rows, {
    x: perfTbl.x,
    y: perfTbl.y,
    w: perfTbl.w,
    colW: perfTbl.colW,
    border: { pt: 0.75, color: "E2E8F0" },
    fontSize: 13,
    fontFace: FONT,
    valign: "middle",
    rowH: 0.36,
    autoPage: false,
    margin: 0.08,
  });

  const out = await pptx.write({ outputType: "nodebuffer" as PptxGenJS.OutputType });
  const buffer = Buffer.from(out as Uint8Array);

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Length": String(buffer.byteLength),
      "Content-Disposition": `attachment; filename="${report.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pptx"`,
    },
  });
}