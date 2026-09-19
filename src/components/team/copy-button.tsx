"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";
import { Link2, Check } from "lucide-react";

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const { tr } = useLocale();
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable (e.g. non-secure context)
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Link2 className="h-3.5 w-3.5" />}
      {copied ? tr("Copied", "تم النسخ") : (label ?? tr("Copy link", "نسخ الرابط"))}
    </Button>
  );
}