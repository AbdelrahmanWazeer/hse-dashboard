export function formatDurationLabel(minutes: number, t: (en: string, ar: string) => string): string {
  const total = Math.max(0, Math.min(Number.isFinite(minutes) ? minutes : 0, 100000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  const sep = t(" ", " ");
  if (h > 0 && m > 0) {
    return `${h}${t("h", "س")}${sep}${m}${t("m", "د")}`;
  }
  if (h > 0) return `${h}${t("h", "س")}`;
  if (m > 0) return `${m}${t("m", "د")}`;
  return t("—", "—");
}