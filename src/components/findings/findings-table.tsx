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
import { useLocale } from "@/components/i18n/locale-provider";
import { FINDING_SEVERITY_META, FINDING_STATUS_META } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Search, ArrowUpDown } from "lucide-react";

export type FindingRow = {
  id: string;
  findingNo: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  projectName?: string | null;
  location?: string | null;
  createdAt: number;
};

const columnHelper = createColumnHelper<FindingRow>();

export function FindingsTable({ findings, projects }: { findings: FindingRow[]; projects: { value: string; label: string }[] }) {
  const { tr, locale } = useLocale();
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [severity, setSeverity] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [project, setProject] = React.useState("all");
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

  const data = React.useMemo(
    () =>
      findings.filter((f) => {
        if (severity !== "all" && f.severity !== severity) return false;
        if (status !== "all" && f.status !== status) return false;
        if (project !== "all" && f.projectName !== project && f.projectName != null) return false;
        return true;
      }),
    [findings, severity, status, project]
  );

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("findingNo", {
        header: tr("No.", "الرقم"),
        cell: (info) => (
          <Link href={`/findings/${info.row.original.id}`} className="font-mono text-xs text-muted-foreground hover:text-primary">
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("title", {
        header: tr("Title", "العنوان"),
        cell: (info) => (
          <Link href={`/findings/${info.row.original.id}`} className="font-medium hover:text-primary">
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("projectName", {
        header: tr("Project", "المشروع"),
        cell: (info) => info.getValue() ?? "—",
      }),
      columnHelper.accessor("category", {
        header: tr("Category", "الفئة"),
        cell: (info) => (
          <span className="capitalize text-muted-foreground">{String(info.getValue()).replace(/_/g, " ")}</span>
        ),
      }),
      columnHelper.accessor("severity", {
        header: tr("Severity", "الخطورة"),
        cell: (info) => {
          const meta = FINDING_SEVERITY_META[info.getValue()];
          return (
            <Badge variant="outline" style={{ borderColor: meta?.color, color: meta?.color }}>
              {tr(meta?.label ?? info.getValue(), meta?.labelAr ?? meta?.label ?? info.getValue())}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: tr("Status", "الحالة"),
        cell: (info) => {
          const meta = FINDING_STATUS_META[info.getValue()];
          return (
            <Badge variant="outline" style={{ borderColor: meta?.color, color: meta?.color }}>
              {tr(meta?.label ?? info.getValue(), meta?.labelAr ?? meta?.label ?? info.getValue())}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("createdAt", {
        header: ({ column }) => (
          <button className="inline-flex items-center gap-1" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            {tr("Date", "التاريخ")}
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: (info) => formatDate(info.getValue(), locale),
      }),
    ],
    [tr, locale]
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
              placeholder={tr("Search findings...", "ابحث في الملاحظات...")}
              className="pl-8"
            />
          </div>
          <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="all">{tr("All severities", "كل درجات الخطورة")}</option>
            {Object.entries(FINDING_SEVERITY_META).map(([v, m]) => (
              <option key={v} value={v}>{tr(m.label, m.labelAr)}</option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">{tr("All statuses", "كل الحالات")}</option>
            {Object.entries(FINDING_STATUS_META).map(([v, m]) => (
              <option key={v} value={v}>{tr(m.label, m.labelAr)}</option>
            ))}
          </Select>
          <Select value={project} onChange={(e) => setProject(e.target.value)}>
            <option value="all">{tr("All projects", "كل المشاريع")}</option>
            {projects.map((p) => (
              <option key={p.value} value={p.label}>{p.label}</option>
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
                  {tr("No findings match your filters.", "لا توجد ملاحظات تطابق عوامل التصفية.")}
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
          {tr("Showing", "عرض")} {table.getRowCount() === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1}–
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, table.getRowCount())} {tr("of", "من")} {table.getRowCount()} {tr("findings", "ملاحظة")}
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