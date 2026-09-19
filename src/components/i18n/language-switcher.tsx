"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { setLocale } from "@/app/actions/locale";
import { locales } from "@/lib/i18n/messages";
import { useLocale } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function pick(next: string) {
    setOpen(false);
    if (next === locale) return;
    const res = await setLocale(next);
    if (res.ok) router.refresh();
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.common.language}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Languages className="h-4 w-4" />
        <span className="uppercase">{locale}</span>
      </button>
      {open && (
        <div className="absolute end-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-md border bg-popover p-1 shadow-lg">
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => pick(l)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-accent",
                l === locale ? "font-semibold text-primary" : "text-popover-foreground"
              )}
            >
              <span>{l === "en" ? t.common.english : t.common.arabic}</span>
              {l === locale && <span aria-hidden>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}