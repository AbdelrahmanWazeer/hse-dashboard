"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n";

export async function setLocale(next: string): Promise<{ ok: boolean }> {
  if (!isLocale(next)) return { ok: false };
  const store = await cookies();
  store.set(LOCALE_COOKIE, next, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return { ok: true };
}