import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can, type Permission, ROLE_LABELS } from "@/lib/permissions";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
  jobTitle: string;
  tenantId: string | null;
  tenantSlug: string;
  permissions: string[];
};

export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user as SessionUser;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role as "admin" | "editor" | "publisher" | "viewer", permission)) {
    redirect("/dashboard");
  }
  return user;
}

export function userLabel(role: string) {
  return ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role;
}