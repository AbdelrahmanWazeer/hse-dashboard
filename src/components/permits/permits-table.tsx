"use client";

import * as React from "react";
import Link from "next/link";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PERMIT_TYPE_LABELS, PERMIT_TYPE_LABELS_AR, PERMIT_STATUS_META } from "@/lib/constants";
import { useLocale } from "@/components/i18n/locale-provider";
import { formatDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { MapPin } from "lucide-react";

export type PermitRow = {
  id: string;
  permitNo: string;
  permitType: string;
  title: string;
  location?: string | null;
  status: string;
  startDate: number;
  endDate: number;
  projectName?: string | null;
  hasCoords: boolean;
};

const PAGE = 12;

export function PermitsTable({ permits }: { permits: PermitRow[] }) {
  const { tr, locale } = useLocale();
  const [query, setQuery] = React.useState("");
  const [type, setType] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [page, setPage] = React.useState(0);

  const filtered = React.useMemo(() => {
    return permits.filter((p) => {
      if (type !== "all" && p.permitType !== type) return false;
      if (status !== "all" && p.status !== status) return false;
      if (query && !`${p.permitNo} ${p.title} ${p.location ?? ""}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [permits, type, status, query]);

  const paged = filtered.slice(page * PAGE, (page + 1) * PAGE);
  const pageCount = Math.ceil(filtered.length / PAGE);
  const from = filtered.length === 0 ? 0 : page * PAGE + 1;
  const to = Math.min((page + 1) * PAGE, filtered.length);

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder={tr("Search permits...", "بحث عن التصاريح...")} className="pl-8" />
          </div>
          <Select value={type} onChange={(e) => { setType(e.target.value); setPage(0); }}>
            <option value="all">{tr("All types", "جميع الأنواع")}</option>
            {Object.entries(PERMIT_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{tr(l, PERMIT_TYPE_LABELS_AR[v] ?? l)}</option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
            <option value="all">{tr("All statuses", "جميع الحالات")}</option>
            {Object.entries(PERMIT_STATUS_META).map(([v, m]) => (
              <option key={v} value={v}>{tr(m.label, m.labelAr ?? m.label)}</option>
            ))}
          </Select>
          <Link href="/permits/map" className="inline-flex h-9 items-center gap-2 rounded-md border border-input px-4 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground">
            <MapPin className="h-4 w-4" />
            {tr("View on map", "عرض على الخريطة")}
          </Link>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tr("Permit No.", "رقم التصريح")}</TableHead>
              <TableHead>{tr("Title", "العنوان")}</TableHead>
              <TableHead>{tr("Type", "النوع")}</TableHead>
              <TableHead>{tr("Project", "المشروع")}</TableHead>
              <TableHead>{tr("Location", "الموقع")}</TableHead>
              <TableHead>{tr("Start", "تاريخ البداية")}</TableHead>
              <TableHead>{tr("End", "تاريخ النهاية")}</TableHead>
              <TableHead>{tr("Status", "الحالة")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  {tr("No permits match your filters.", "لا توجد تصاريح مطابقة لمعايير البحث.")}
                </TableCell>
              </TableRow>
            )}
            {paged.map((p) => {
              const meta = PERMIT_STATUS_META[p.status];
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/permits/${p.id}/edit`} className="font-mono text-xs text-muted-foreground hover:text-primary">
                      {p.permitNo}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/permits/${p.id}/edit`} className="font-medium hover:text-primary">
                      {p.title}
                    </Link>
                  </TableCell>
                  <TableCell>{tr(PERMIT_TYPE_LABELS[p.permitType] ?? p.permitType, PERMIT_TYPE_LABELS_AR[p.permitType] ?? PERMIT_TYPE_LABELS[p.permitType] ?? p.permitType)}</TableCell>
                  <TableCell>{p.projectName ?? "—"}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{p.location ?? "—"}</TableCell>
                  <TableCell className="text-xs">{formatDate(p.startDate, locale)}</TableCell>
                  <TableCell className="text-xs">{formatDate(p.endDate, locale)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" style={{ borderColor: meta?.color, color: meta?.color }}>
                      {tr(meta?.label ?? p.status, meta?.labelAr ?? meta?.label ?? p.status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>{tr(`Showing ${from}–${to} of ${filtered.length} permits`, `عرض ${from}–${to} من أصل ${filtered.length} تصريح${filtered.length === 1 ? "" : "ات"}`)}</p>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}