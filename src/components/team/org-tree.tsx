"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/permissions";
import { JOB_TITLES, ROLES } from "@/lib/constants";
import { useLocale } from "@/components/i18n/locale-provider";
import { Users, Building2 } from "lucide-react";

export type OrgNode = {
  id: string;
  name: string;
  jobTitle: string;
  role: string;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  projectName?: string | null;
  children: OrgNode[];
};

const levelColor = (jobTitle: string) => {
  if (jobTitle === "HSE Manager") return "border-teal-500/60 bg-teal-500/10";
  if (jobTitle === "HSE Senior Supervisor" || jobTitle === "Section Head" || jobTitle === "HSE Team Leader") return "border-sky-500/60 bg-sky-500/10";
  return "border-border bg-card";
};

const roleLabelAr: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.value, r.labelAr]));

export function OrgTree({ root }: { root: OrgNode[] }) {
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());
  const { tr } = useLocale();

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderNode = (node: OrgNode, depth: number) => {
    const isCollapsed = collapsed.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className={`relative flex items-center gap-3 rounded-xl border p-2.5 ${depth === 0 ? "" : levelColor(node.jobTitle)} transition-colors hover:bg-muted/60`}
          style={{ marginLeft: depth === 0 ? 0 : undefined }}
        >
          {depth > 0 && (
            <span
              className="absolute -top-4 left-[19px] h-4 w-px bg-border"
              aria-hidden
            />
          )}
          <Avatar name={node.name} image={node.avatar} className="h-8 w-8 text-[10px]" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold">{node.name}</p>
              {node.jobTitle === "HSE Manager" && (
                <Badge variant="success">{tr("Manager", "مدير")}</Badge>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">{node.jobTitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {node.projectName && (
              <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                <Building2 className="h-3 w-3" />
                {node.projectName}
              </span>
            )}
            <Badge variant="secondary">{tr(ROLE_LABELS[node.role as keyof typeof ROLE_LABELS] ?? node.role, roleLabelAr[node.role] ?? node.role)}</Badge>
            {hasChildren && (
              <button
                onClick={() => toggle(node.id)}
                className="rounded-md p-1 text-xs font-bold text-muted-foreground hover:bg-muted"
                aria-label={isCollapsed ? tr("Expand", "توسيع") : tr("Collapse", "طي")}
              >
                {isCollapsed ? "+" : "−"}
              </button>
            )}
          </div>
        </div>

        {hasChildren && !isCollapsed && (
          <div className="mt-4 space-y-4 border-l border-border pl-4" style={{ marginLeft: 20 }}>
            {node.children.map((c) => renderNode(c, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (root.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-12 text-center text-muted-foreground">
        <Users className="h-8 w-8" />
        <p className="text-sm font-medium">{tr("No team members yet", "لا يوجد أعضاء في الفريق بعد")}</p>
        <p className="text-xs">{tr("Invite team members to build your org chart.", "ادعُ أعضاء الفريق لبناء المخطط التنظيمي.")}</p>
      </div>
    );
  }

  return <div className="space-y-4">{root.map((n) => renderNode(n, 0))}</div>;
}