import { headers } from "next/headers";

export async function getBaseUrl(): Promise<string> {
  try {
    const h = await headers();
    const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "http";
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) return `${proto}://${host}`;
  } catch {
    // not within a request scope
  }
  return process.env.APP_URL ?? "http://localhost:3000";
}