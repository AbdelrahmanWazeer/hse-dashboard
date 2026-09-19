import type { Role } from "@/lib/db/schema";

export type Permission =
  | "dashboard:view"
  | "findings:view"
  | "findings:create"
  | "findings:edit"
  | "findings:delete"
  | "incidents:view"
  | "incidents:create"
  | "incidents:edit"
  | "incidents:delete"
  | "permits:view"
  | "permits:create"
  | "permits:edit"
  | "permits:approve"
  | "permits:delete"
  | "inventory:view"
  | "inventory:manage"
  | "stats:view"
  | "stats:create"
  | "stats:edit"
  | "team:view"
  | "team:invite"
  | "team:manage"
  | "reports:view"
  | "reports:create"
  | "reports:export"
  | "reports:publish"
  | "articles:view"
  | "articles:create"
  | "articles:publish"
  | "articles:edit"
  | "articles:delete"
  | "reports:delete"
  | "courses:view"
  | "courses:manage"
  | "settings:view"
  | "settings:manage"
  | "users:manage";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "dashboard:view",
    "findings:view",
    "findings:create",
    "findings:edit",
    "findings:delete",
    "incidents:view",
    "incidents:create",
    "incidents:edit",
    "incidents:delete",
    "permits:view",
    "permits:create",
    "permits:edit",
    "permits:approve",
    "permits:delete",
    "inventory:view",
    "inventory:manage",
    "stats:view",
    "stats:create",
    "stats:edit",
    "team:view",
    "team:invite",
    "team:manage",
    "reports:view",
    "reports:create",
    "reports:export",
    "reports:publish",
    "reports:delete",
    "articles:view",
    "articles:create",
    "articles:publish",
    "articles:edit",
    "articles:delete",
    "courses:view",
    "courses:manage",
    "settings:view",
    "settings:manage",
    "users:manage",
  ],
  publisher: [
    "dashboard:view",
    "findings:view",
    "findings:create",
    "findings:edit",
    "incidents:view",
    "incidents:create",
    "incidents:edit",
    "permits:view",
    "permits:create",
    "permits:edit",
    "inventory:view",
    "inventory:manage",
    "stats:view",
    "stats:create",
    "stats:edit",
    "team:view",
    "team:invite",
    "reports:view",
    "reports:create",
    "reports:export",
    "reports:publish",
    "articles:view",
    "articles:create",
    "articles:publish",
    "articles:edit",
    "articles:delete",
    "courses:view",
    "courses:manage",
    "settings:view",
  ],
  editor: [
    "dashboard:view",
    "findings:view",
    "findings:create",
    "findings:edit",
    "incidents:view",
    "incidents:create",
    "incidents:edit",
    "permits:view",
    "permits:create",
    "permits:edit",
    "inventory:view",
    "inventory:manage",
    "stats:view",
    "stats:create",
    "stats:edit",
    "team:view",
    "reports:view",
    "reports:create",
    "reports:export",
    "articles:view",
    "articles:create",
    "articles:edit",
    "courses:view",
    "courses:manage",
    "settings:view",
  ],
  viewer: [
    "dashboard:view",
    "findings:view",
    "incidents:view",
    "permits:view",
    "inventory:view",
    "stats:view",
    "team:view",
    "reports:view",
    "articles:view",
    "courses:view",
    "settings:view",
  ],
};

export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return getPermissions(role).includes(permission);
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  editor: "Editor",
  publisher: "Publisher",
  viewer: "Viewer",
};