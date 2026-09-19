"use client";

import * as React from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { INCIDENT_TYPE_META } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { useLocale } from "@/components/i18n/locale-provider";
import { ChevronLeft, ChevronRight, Search, ArrowUpDown } from "lucide-react";

export type IncidentRow = {
  id: string;
  incidentNo: string;
  incidentType: string;
  description: string;
  personName?: string | null;
  projectName?: string | null;
  location?: string | null;
  lostDays: number;
  date: number;
};

const columnHelper = createColumnHelper<IncidentRow>();

export function IncidentsTable({
  incidents,
  projectFilter,
}: {
  incidents: IncidentRow[];
  projectFilter?: { value: string; label: string }[];
}) {
  const { locale, tr } = useLocale();
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [type, setType] = React.useState("all");
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "date", desc: true }]);

  const data = React.useMemo(
    () => (type === "all" ? incidents : incidents.filter((i) => i.incidentType === type)),
    [incidents, type]
  );

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("incidentNo", {
        header: tr("No.", "رقم"),
        cell: (info) => (
          <Link href={`/incidents/${info.row.original.id}`} className="font-mono text-xs text-muted-foreground hover:text-primary">
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("incidentType", {
        header: tr("Type", "النوع"),
        cell: (info) => {
          const meta = INCIDENT_TYPE_META[info.getValue()];
          return (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 rounded-full" style={{ background: meta?.color }} />
              <span>{tr(meta?.label ?? info.getValue(), meta?.labelAr ?? meta?.label ?? info.getValue())}</span>
            </span>
          );
        },
      }),
      columnHelper.accessor("description", {
        header: tr("Description", "الوصف"),
        cell: (info) => info.getValue().length > 60 ? `${info.getValue().slice(0, 60)}…` : info.getValue(),
      }),
      columnHelper.accessor("personName", {
        header: tr("Person", "الشخص"),
        cell: (info) => info.getValue() ?? "—",
      }),
      columnHelper.accessor("projectName", {
        header: tr("Project", "المشروع"),
        cell: (info) => info.getValue() ?? "—",
      }),
      columnHelper.accessor("location", {
        header: tr("Location", "الموقع"),
        cell: (info) => info.getValue() ?? "—",
      }),
      columnHelper.accessor("lostDays", {
        header: tr("Lost days", "أيام العمل المفقودة"),
        cell: (info) => info.getValue() || "—",
      }),
      columnHelper.accessor("date", {
        header: ({ column }) => (
          <button className="inline-flex items-center gap-1" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            {tr("Date", "التاريخ")}
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: (info) => formatDate(info.getValue(), locale),
      }),
    ],
    [locale, tr]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={tr("Search incidents...", "ابحث في الحوادث...")}
              className="pl-8"
            />
          </div>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">{tr("All types", "جميع الأنواع")}</option>
            {Object.entries(INCIDENT_TYPE_META).map(([v, m]) => (
              <option key={v} value={v}>{tr(m.label, m.labelAr)}</option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-12 text-center text-muted-foreground">
                  {tr("No incidents match your filters.", "لا توجد حوادث مطابقة لمعايير البحث.")}
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          {tr(
            `Showing ${table.getRowCount() === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1}–${Math.min((pagination.pageIndex + 1) * pagination.pageSize, table.getRowCount())} of ${table.getRowCount()} incidents`,
            `عرض ${table.getRowCount() === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1}–${Math.min((pagination.pageIndex + 1) * pagination.pageSize, table.getRowCount())} من أصل ${table.getRowCount()} حادثة`
          )}
        </p>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}