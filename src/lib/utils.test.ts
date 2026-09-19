import { describe, it, expect } from "vitest";
import { fromDateInputValue, slugify, humanize, monthKey, daysBetween, formatDate, formatNumber, formatCurrency } from "./utils";
import { can } from "./permissions";

describe("utils", () => {
  it("parses date input values", () => {
    expect(fromDateInputValue("2026-06-15")).toBe(new Date("2026-06-15T00:00:00").getTime());
    expect(fromDateInputValue("")).toBeUndefined();
    expect(fromDateInputValue("not-a-date")).toBeUndefined();
  });

  it("slugifies, humanizes and keys months", () => {
    expect(slugify("  Hello, World!  ")).toBe("hello-world");
    expect(humanize("working_at_height")).toBe("Working At Height");
    expect(monthKey(new Date("2026-06-15").getTime())).toBe("2026-06");
  });

  it("computes day spans and formats dates/numbers", () => {
    expect(daysBetween(new Date("2026-06-01").getTime(), new Date("2026-06-16").getTime())).toBe(15);
    expect(formatDate(0)).toBe("-");
    expect(formatNumber(null)).toBe("0");
    expect(formatCurrency(undefined)).toBe("$0");
    expect(formatDate(new Date("2026-06-15").getTime())).toBe("15 Jun 2026");
  });
});

describe("permissions", () => {
  it("grants admin everything and viewers read-only stats", () => {
    expect(can("admin", "users:manage")).toBe(true);
    expect(can("viewer", "stats:view")).toBe(true);
    expect(can("viewer", "stats:create")).toBe(false);
    expect(can(undefined, "stats:view")).toBe(false);
  });
});