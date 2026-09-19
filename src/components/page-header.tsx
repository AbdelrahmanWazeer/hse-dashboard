import * as React from "react";
import { getDictionary } from "@/lib/i18n";

export async function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  const t = await getDictionary();
  const headers = t.headers as Record<string, string | { title: string; description: string }>;
  const titleEntry = headers[title];
  const descriptionEntry = description ? headers[description] : undefined;

  const finalTitle = typeof titleEntry === "object" && titleEntry.title ? titleEntry.title : title;
  const finalDescription =
    typeof titleEntry === "object" && titleEntry.description
      ? titleEntry.description
      : typeof descriptionEntry === "string"
        ? descriptionEntry
        : description;

  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{finalTitle}</h1>
        {finalDescription && (
          <p className="mt-1 text-sm text-muted-foreground">{finalDescription}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function PageToolbar({ children }: { children?: React.ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>;
}