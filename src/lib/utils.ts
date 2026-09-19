import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type DateLocale = "en" | "ar";

function dateLocale(locale?: DateLocale) {
  return locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB";
}

export function formatDate(ts: number | null | undefined, locale?: DateLocale) {
  if (!ts) return "-";
  return new Date(ts).toLocaleDateString(dateLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(ts: number | null | undefined, locale?: DateLocale) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString(dateLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(n: number | null | undefined) {
  if (n == null) return "0";
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatCurrency(n: number | null | undefined) {
  if (n == null) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function startOfYear(d = new Date()) {
  return new Date(d.getFullYear(), 0, 1);
}

export function daysBetween(a: number, b: number) {
  return Math.round((b - a) / 86400000);
}

export function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(ts);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function monthLabel(monthIndex: number, locale?: DateLocale) {
  if (locale === "ar") {
    const d = new Date(2000, monthIndex, 1);
    return new Intl.DateTimeFormat("ar-EG-u-nu-latn", { month: "short" }).format(d);
  }
  return MONTHS[monthIndex] ?? monthIndex.toString();
}

export function monthKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function humanize(value: string) {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function toDateInputValue(ts: number | null | undefined) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function fromDateInputValue(value: string): number | undefined {
  if (!value) return undefined;
  const t = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(t) ? undefined : t;
}

export function toTimeInputValue(ts: number | null | undefined) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}