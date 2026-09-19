"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronsUpDown } from "lucide-react";

export function BadgeSelect({
  value,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value?: string }) {
  return (
    <button type="button" className={cn("inline-flex items-center gap-2 rounded-md border border-input px-3 py-1 text-sm", className)} {...props}>
      {children}
      <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  );
}