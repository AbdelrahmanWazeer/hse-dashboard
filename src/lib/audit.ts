import "server-only";
import { db } from "@/lib/db";
import { auditLogs, id } from "@/lib/db/schema";

export type AuditDetails = Record<string, unknown>;

export function logAudit(opts: {
  tenantId: string;
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: AuditDetails;
}) {
  db.insert(auditLogs)
    .values({
      id: id("aud"),
      tenantId: opts.tenantId,
      actorId: opts.actorId ?? null,
      actorName: opts.actorName ?? null,
      action: opts.action,
      entityType: opts.entityType,
      entityId: opts.entityId ?? null,
      details: opts.details ?? {},
      createdAt: Date.now(),
    })
    .run();
}