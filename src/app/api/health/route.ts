import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    db.get<{ ok: number }>("SELECT 1");
    return Response.json({ ok: true, service: "hse-dashboard", time: Date.now(), db: "up" });
  } catch {
    return Response.json({ ok: false, service: "hse-dashboard", time: Date.now(), db: "down" }, { status: 503 });
  }
}