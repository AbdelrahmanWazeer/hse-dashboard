import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";

const DEFAULT_SLUG = "main";

export type TenantContext = {
  id: string;
  slug: string;
  name: string;
  plan: string;
  primaryColor: string;
  logoUrl: string | null;
};

export async function resolveTenantSlug(): Promise<string> {
  const store = await cookies();
  const cookieSlug = store.get("tenant")?.value;
  if (cookieSlug) return cookieSlug;
  return DEFAULT_SLUG;
}

export async function setTenantCookie(slug: string) {
  const store = await cookies();
  store.set("tenant", slug, { path: "/" });
}

export const getCurrentTenant = cache(async (): Promise<TenantContext> => {
  const slug = await resolveTenantSlug();
  const tenant = db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .get();

  if (!tenant) {
    const fallback = db.select().from(tenants).get();
    if (!fallback) {
      throw new Error("No tenant configured. Please run `npm run db:seed` first.");
    }
    return tenantToContext(fallback);
  }
  return tenantToContext(tenant);
});

function tenantToContext(t: typeof tenants.$inferSelect): TenantContext {
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    plan: t.plan ?? "starter",
    primaryColor: t.primaryColor ?? "#0f766e",
    logoUrl: t.logoUrl ?? null,
  };
}

export async function listTenants(): Promise<TenantContext[]> {
  return (db.select().from(tenants).all() ?? []).map(tenantToContext);
}