"use client";

import dynamic from "next/dynamic";
import { useLocale } from "@/components/i18n/locale-provider";
import type { PermitMarker, LayoutImage } from "./permit-map";

function MapLoading() {
  const { tr } = useLocale();
  return (
    <div className="flex h-[480px] items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground animate-pulse">
      {tr("Loading map...", "جارٍ تحميل الخريطة...")}
    </div>
  );
}

const PermitMap = dynamic(() => import("./permit-map").then((m) => m.PermitMap), {
  ssr: false,
  loading: () => <MapLoading />,
});

export function PermitMapLoader({
  permits,
  layout,
  projectName,
}: {
  permits: PermitMarker[];
  layout: LayoutImage | null;
  projectName?: string;
}) {
  return <PermitMap permits={permits} layout={layout} projectName={projectName} />;
}