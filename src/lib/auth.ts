import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { headers as nextHeaders } from "next/headers";
import { db } from "@/lib/db";
import { users, memberships, tenants, id } from "@/lib/db/schema";
import { getPermissions } from "@/lib/permissions";
import { checkRateLimit, resetRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const AUTH_SECRET = process.env.AUTH_SECRET ?? "hse-demo-secret-change-me-in-production-0123456789";

export const AUTH_MAX_ATTEMPTS = 5;
export const AUTH_WINDOW_MS = 15 * 60 * 1000;

const DEFAULT_JOB_TITLE = "HSE";

function loadUserContext(email: string): {
  id: string;
  name: string;
  image: string | null;
  role: string;
  jobTitle: string;
  tenantId: string | null;
  tenantSlug: string;
} | null {
  const user = db.select().from(users).where(eq(users.email, email)).get();
  if (!user) return null;

  let role: string = "viewer";
  let jobTitle = DEFAULT_JOB_TITLE;
  let tenantId: string | null = null;
  let tenantSlug = "main";

  const membership = db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, user.id), eq(memberships.isActive, true)))
    .get();

  if (membership) {
    role = membership.role;
    jobTitle = membership.jobTitle;
    const tenant = db.select().from(tenants).where(eq(tenants.id, membership.tenantId)).get();
    if (tenant) {
      tenantId = tenant.id;
      tenantSlug = tenant.slug;
    }
  }

  return { id: user.id, name: user.name, image: user.image, role, jobTitle, tenantId, tenantSlug };
}

function assertUserForOAuth(email: string, name: string | null | undefined, image: string | null | undefined) {
  const existing = loadUserContext(email);
  if (existing) return existing;

  const now = Date.now();
  const userId = id("usr");
  const fakeHash = bcrypt.hashSync(randomBytes(32).toString("hex"), 10);
  db.insert(users)
    .values({
      id: userId,
      name: name ?? email.split("@")[0],
      email,
      passwordHash: fakeHash,
      image: image ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const tenant = db.select().from(tenants).orderBy(tenants.slug).get();
  if (tenant) {
    db.insert(memberships)
      .values({
        id: id("msh"),
        userId,
        tenantId: tenant.id,
        role: "viewer",
        jobTitle: DEFAULT_JOB_TITLE,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  }

  logger.info("provisioned oauth user", { email, tenantId: tenant?.id ?? null });
  return loadUserContext(email);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  secret: AUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const email = (creds?.email as string | undefined)?.toLowerCase().trim();
        const password = creds?.password as string | undefined;
        if (!email || !password) return null;

        let ip: string | undefined;
        try {
          const h = await nextHeaders();
          ip = (h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")) ?? undefined;
        } catch {
          /* nextHeaders unavailable outside request context */
        }

        const rlKey = rateLimitKey(ip, email);
        const limiter = checkRateLimit(rlKey, { limit: AUTH_MAX_ATTEMPTS, windowMs: AUTH_WINDOW_MS });
        if (!limiter.ok) {
          logger.warn("login rate limited", { email, ip, retryAfterMs: limiter.retryAfterMs });
          return null;
        }

        const user = db.select().from(users).where(eq(users.email, email)).get();
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;
        resetRateLimit(rlKey);

        const ctx = loadUserContext(email);
        if (!ctx) return null;

        return {
          id: ctx.id,
          email,
          name: ctx.name,
          image: ctx.image,
          tenantId: ctx.tenantId,
          tenantSlug: ctx.tenantSlug,
          role: ctx.role,
          jobTitle: ctx.jobTitle,
          permissions: getPermissions(ctx.role as "admin" | "editor" | "publisher" | "viewer"),
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET
      ? [
          LinkedIn({
            clientId: process.env.LINKEDIN_CLIENT_ID,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    signIn({ user, account, profile }) {
      if (!account || account.provider === "credentials") return true;
      const email = (profile?.email as string | undefined) ?? user.email;
      if (!email) {
        logger.warn("oauth sign-in rejected: no email", { provider: account.provider });
        return false;
      }
      const normalized = email.toLowerCase().trim();
      const existing = loadUserContext(normalized);
      if (!existing) {
        assertUserForOAuth(normalized, user.name, user.image);
      } else if (user.image && !existing.image) {
        db.update(users).set({ image: user.image as string, updatedAt: Date.now() }).where(eq(users.id, existing.id)).run();
      }
      return true;
    },
    jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "credentials") {
          token.id = user.id as string;
          token.role = (user as { role?: string }).role ?? "viewer";
          token.jobTitle = (user as { jobTitle?: string }).jobTitle ?? DEFAULT_JOB_TITLE;
          token.tenantId = (user as { tenantId?: string | null }).tenantId ?? null;
          token.tenantSlug = (user as { tenantSlug?: string }).tenantSlug ?? "main";
          token.permissions = (user as { permissions?: string[] }).permissions ?? [];
        } else if (user.email) {
          const ctx = loadUserContext(user.email.toLowerCase().trim());
          if (ctx) {
            token.id = ctx.id;
            token.role = ctx.role;
            token.jobTitle = ctx.jobTitle;
            token.tenantId = ctx.tenantId;
            token.tenantSlug = ctx.tenantSlug;
            token.permissions = getPermissions(ctx.role as "admin" | "editor" | "publisher" | "viewer");
            token.name = user.name ?? token.name;
            token.picture = user.image ?? token.picture;
          }
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.jobTitle = token.jobTitle as string;
        session.user.tenantId = token.tenantId as string | null;
        session.user.tenantSlug = token.tenantSlug as string;
        session.user.permissions = (token.permissions as string[]) ?? [];
      }
      return session;
    },
  },
});