"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  AlertTriangle,
  ClipboardList,
  HardHat,
  Users,
  FileText,
  Newspaper,
  Settings,
  Map,
  BarChart3,
  ShieldCheck,
  FolderTree,
  MessagesSquare,
  GraduationCap,
  Clock,
  BookOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Session } from "next-auth";
import { useLocale } from "@/components/i18n/locale-provider";
import type { Messages } from "@/lib/i18n/messages";

const NAV_SECTIONS: {
  titleKey: keyof Messages["nav"]["sections"];
  permission: string;
  items: { href: string; labelKey: keyof Omit<Messages["nav"], "sections">; icon: React.ReactNode; permission?: string }[];
}[] = [
  {
    titleKey: "overview",
    permission: "dashboard:view",
    items: [{ href: "/dashboard", labelKey: "dashboard", icon: <LayoutDashboard className="h-4 w-4" />, permission: "dashboard:view" }],
  },
  {
    titleKey: "hseManagement",
    permission: "findings:view",
    items: [
      { href: "/findings", labelKey: "findings", icon: <Search className="h-4 w-4" />, permission: "findings:view" },
      { href: "/incidents", labelKey: "incidents", icon: <AlertTriangle className="h-4 w-4" />, permission: "incidents:view" },
      { href: "/permits", labelKey: "workPermits", icon: <ClipboardList className="h-4 w-4" />, permission: "permits:view" },
      { href: "/permits/map", labelKey: "permitMap", icon: <Map className="h-4 w-4" />, permission: "permits:view" },
      { href: "/tbt", labelKey: "toolboxTalks", icon: <MessagesSquare className="h-4 w-4" />, permission: "stats:view" },
      { href: "/inductions", labelKey: "inductions", icon: <GraduationCap className="h-4 w-4" />, permission: "stats:view" },
      { href: "/manhours", labelKey: "manhours", icon: <Clock className="h-4 w-4" />, permission: "stats:view" },
      { href: "/stats", labelKey: "statistics", icon: <BarChart3 className="h-4 w-4" />, permission: "stats:view" },
    ],
  },
  {
    titleKey: "resources",
    permission: "inventory:view",
    items: [
      { href: "/inventory", labelKey: "ppeInventory", icon: <HardHat className="h-4 w-4" />, permission: "inventory:view" },
      { href: "/courses", labelKey: "courses", icon: <BookOpen className="h-4 w-4" />, permission: "courses:view" },
      { href: "/team", labelKey: "team", icon: <Users className="h-4 w-4" />, permission: "team:view" },
      { href: "/projects", labelKey: "projects", icon: <FolderTree className="h-4 w-4" />, permission: "team:view" },
    ],
  },
  {
    titleKey: "content",
    permission: "reports:view",
    items: [
      { href: "/reports", labelKey: "reports", icon: <FileText className="h-4 w-4" />, permission: "reports:view" },
      { href: "/articles", labelKey: "articles", icon: <Newspaper className="h-4 w-4" />, permission: "articles:view" },
    ],
  },
  {
    titleKey: "administration",
    permission: "settings:view",
    items: [{ href: "/settings", labelKey: "settings", icon: <Settings className="h-4 w-4" />, permission: "settings:view" }],
  },
];

function hasPermission(session: Session | null, permission: string) {
  if (!session?.user) return false;
  if (session.user.role === "admin") return true;
  return session.user.permissions?.includes(permission) ?? false;
}

export function Sidebar({
  session,
  tenantName,
  open,
  onClose,
}: {
  session: Session | null;
  tenantName: string;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { t } = useLocale();

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold">HSE Dashboard</p>
            <p className="text-[10px] text-muted-foreground">{tenantName}</p>
          </div>
        </Link>
        <button className="rounded-md p-1 text-muted-foreground hover:bg-muted lg:hidden" onClick={onClose} aria-label={t.header.closeMenu}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((i) => hasPermission(session, i.permission ?? section.permission));
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.titleKey}>
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t.nav.sections[section.titleKey]}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-sidebar-foreground hover:bg-muted"
                      )}
                    >
                      {item.icon}
                      {t.nav[item.labelKey]}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-2 rounded-lg bg-muted p-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold">{session?.user?.name}</p>
            <p className="truncate text-[10px] capitalize text-muted-foreground">
              {session?.user?.role} • {session?.user?.jobTitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r bg-sidebar text-sidebar-foreground lg:block">{content}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <aside className="fixed inset-y-0 start-0 z-10 w-64 bg-sidebar text-sidebar-foreground shadow-xl">{content}</aside>
        </div>
      )}
    </>
  );
}