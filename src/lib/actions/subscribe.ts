"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { rateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { getLocale, getT } from "@/lib/i18n";

export type SubscribeResult = { ok: true } | { ok: false; error: "rate" | "invalid" | "duplicate" };

export async function subscribe(prev: unknown, formData: FormData): Promise<SubscribeResult> {
  const t = await getT();
  const locale = await getLocale();
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { ok: false, error: "invalid" };
  }

  const limiter = checkRateLimit(rateLimitKey(undefined, email), { limit: 5, windowMs: 60_000 });
  if (!limiter.ok) {
    return { ok: false, error: "rate" };
  }

  const existing = db.select().from(subscribers).where(eq(subscribers.email, email)).get();
  if (existing) {
    return { ok: false, error: "duplicate" };
  }

  db.insert(subscribers).values({ email, createdAt: Date.now() }).run();
  return { ok: true };
}
