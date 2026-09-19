"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const TabsContext = React.createContext<{
  value: string;
  setValue: (v: string) => void;
} | null>(null);

function Tabs({ value, onValueChange, className, ...props }: React.ComponentPropsWithoutRef<"div"> & { value?: string; defaultValue?: string; onValueChange?: (v: string) => void }) {
  const [internal, setInternal] = React.useState(props.defaultValue ?? "");
  const current = value ?? internal;
  const set = (v: string) => {
    setInternal(v);
    onValueChange?.(v);
  };
  return (
    <TabsContext.Provider value={{ value: current, setValue: set }}>
      <div className={className} {...props} />
    </TabsContext.Provider>
  );
}

function useTabs() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used within <Tabs>");
  return ctx;
}

function TabsList({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className)} {...props} />;
}

function TabsTrigger({ value, className, ...props }: React.ComponentPropsWithoutRef<"button"> & { value: string }) {
  const { value: current, setValue } = useTabs();
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
        current === value && "bg-background text-foreground shadow",
        className
      )}
      onClick={() => setValue(value)}
      {...props}
    />
  );
}

function TabsContent({ value, className, ...props }: React.ComponentPropsWithoutRef<"div"> & { value: string }) {
  const { value: current } = useTabs();
  if (current !== value) return null;
  return <div className={cn("mt-2", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };