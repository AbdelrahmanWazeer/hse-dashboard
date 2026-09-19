"use client";

import * as React from "react";
import { MapContainer, ImageOverlay, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { PERMIT_TYPE_LABELS, PERMIT_TYPE_LABELS_AR, PERMIT_STATUS_META } from "@/lib/constants";
import { useLocale } from "@/components/i18n/locale-provider";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

export type PermitMarker = {
  id: string;
  permitNo: string;
  title: string;
  permitType: string;
  status: string;
  x: number;
  y: number;
  location?: string | null;
};

export type LayoutImage = {
  imageUrl: string;
  width: number;
  height: number;
};

const EMPTY_IMAGE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function markerIcon(permits: PermitMarker[], color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:22px;height:22px;background:${color};border:2px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
  });
}

export function PermitMap({
  permits,
  layout,
  projectName,
}: {
  permits: PermitMarker[];
  layout: LayoutImage | null;
  projectName?: string;
}) {
  const { tr } = useLocale();
  const width = layout?.width ?? 500;
  const height = layout?.height != null ? (layout.height / (layout.width ?? 1)) * width : 350;

  const icons = React.useMemo(() => {
    const map = new Map<string, L.DivIcon>();
    for (const p of permits) {
      if (!map.has(p.permitType)) map.set(p.permitType, markerIcon(permits, "#0f766e"));
    }
    return map;
  }, [permits]);
  const iconFor = (type: string) => icons.get(type)!;

  const crs = L.CRS.Simple;
  const bounds: L.LatLngBoundsExpression = [
    [0, 0],
    [height, width],
  ];

  return (
    <div className="space-y-3">
      {!layout || !layout.imageUrl ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">{tr("No site layout uploaded yet", "لم يتم رفع مخطط الموقع بعد")}</p>
            <p className="text-xs opacity-90">
              {tr(
                "Permit locations below are positioned on a generic grid. Upload a site layout in Settings to show the actual plan behind the markers.",
                "مواقع التصاريح أدناه موضوعة على شبكة عامة. ارفع مخطط الموقع في الإعدادات لعرض المخطط الفعلي خلف العلامات."
              )}
            </p>
          </div>
        </div>
      ) : null}

      <MapContainer
        crs={crs}
        bounds={bounds}
        style={{ width: "100%", height: 480, background: "#0f172a" }}
        zoomControl
        scrollWheelZoom
      >
        <ImageOverlay url={layout?.imageUrl || EMPTY_IMAGE} bounds={bounds} />
        {permits.map((p) => {
          const lng = (p.x / 100) * width;
          const lat = -((p.y / 100) * height);
          const meta = PERMIT_STATUS_META[p.status];
          return (
            <Marker key={p.id} position={[lat, lng]} icon={iconFor(p.permitType)}>
              <Popup>
                <div className="min-w-[180px] space-y-1 font-sans">
                  <p className="text-sm font-bold">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.permitNo}</p>
                  <p className="text-xs">{tr(PERMIT_TYPE_LABELS[p.permitType] ?? p.permitType, PERMIT_TYPE_LABELS_AR[p.permitType] ?? PERMIT_TYPE_LABELS[p.permitType] ?? p.permitType)}</p>
                  {p.location && <p className="text-xs text-muted-foreground">{p.location}</p>}
                  <span>
                    <Badge variant="outline" style={{ borderColor: meta?.color, color: meta?.color }}>
                      {tr(meta?.label ?? p.status, meta?.labelAr ?? meta?.label ?? p.status)}
                    </Badge>
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{tr("Legend:", "مفتاح الخريطة:")}</span>
        {Object.entries(PERMIT_TYPE_LABELS).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-600" />
            {tr(v, PERMIT_TYPE_LABELS_AR[k] ?? v)}
          </span>
        ))}
        <span className="ml-auto">{tr(`${permits.length} permits plotted`, `${permits.length} تصريح${permits.length === 1 ? "" : "ات"} مُوضع`)} · {projectName ?? tr("All projects", "جميع المشاريع")}</span>
      </div>
    </div>
  );
}