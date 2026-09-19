import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { reports, tenants } from "@/lib/db/schema";
import { requireUser } from "@/lib/guards";
import { renderReportHtml } from "@/lib/report-html";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await ctx.params;

  const report = db.select().from(reports).where(eq(reports.id, id)).get();
  if (!report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }
  const tenant = db.select().from(tenants).where(eq(tenants.id, report.tenantId)).get();

  const html = renderReportHtml(report, tenant?.name ?? "HSE");

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${report.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.html"`,
    },
  });
}