"use client";

import * as React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Menu, LogOut, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useLocale } from "@/components/i18n/locale-provider";
import type { Session } from "next-auth";

export function Header({
  session,
  onMenuClick,
  children,
}: {
  session: Session | null;
  onMenuClick: () => void;
  children?: React.ReactNode;
}) {
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden" onClick={onMenuClick} aria-label={t.header.openMenu}>
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex-1">{children}</div>
      <LanguageSwitcher />
      <ThemeToggle />
      <div className="hidden sm:flex sm:items-center sm:gap-1">
        <Link href="/settings">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden md:inline">{t.header.settings}</span>
          </Button>
        </Link>
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/" })}
          className="inline-flex h-8 items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">{t.header.signOut}</span>
        </button>
        {session?.user?.name && (
          <div className="ms-1 hidden h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground md:flex">
            {session.user.name.charAt(0)?.toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}