import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      jobTitle: string;
      tenantId: string | null;
      tenantSlug: string;
      permissions: string[];
    } & DefaultSession["user"];
  }

  interface User {
    tenantId?: string | null;
    tenantSlug?: string;
    role?: string;
    jobTitle?: string;
    permissions?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    jobTitle: string;
    tenantId: string | null;
    tenantSlug: string;
    permissions: string[];
  }
}