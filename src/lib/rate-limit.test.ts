import { describe, it, expect } from "vitest";
import {
  checkRateLimit,
  resetRateLimit,
  rateLimitKey,
} from "./rate-limit";

describe("rate-limit", () => {
  it("allows requests up to the limit", () => {
    resetRateLimit("t:key");
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      const r = checkRateLimit("t:key", { limit: 5, windowMs: 1000, now });
      expect(r.ok).toBe(true);
      expect(r.remaining).toBe(5 - (i + 1));
    }
    const blocked = checkRateLimit("t:key", { limit: 5, windowMs: 1000, now });
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("re-opens the window after it elapses", () => {
    resetRateLimit("t:window");
    const opts = { limit: 2, windowMs: 100 };
    const t0 = 5_000;
    expect(checkRateLimit("t:window", { ...opts, now: t0 }).ok).toBe(true);
    expect(checkRateLimit("t:window", { ...opts, now: t0 }).ok).toBe(true);
    expect(checkRateLimit("t:window", { ...opts, now: t0 }).ok).toBe(false);
    expect(checkRateLimit("t:window", { ...opts, now: t0 + 101 }).ok).toBe(true);
  });

  it("resets a key", () => {
    resetRateLimit("t:reset");
    const opts = { limit: 1, windowMs: 1000, now: 100 };
    checkRateLimit("t:reset", opts);
    expect(checkRateLimit("t:reset", opts).ok).toBe(false);
    resetRateLimit("t:reset");
    expect(checkRateLimit("t:reset", opts).ok).toBe(true);
  });

  it("rejects disabled limits and normalizes keys", () => {
    expect(checkRateLimit("t:off", { limit: 0, now: 0 }).ok).toBe(false);
    expect(rateLimitKey("1.2.3.4", "Admin@Example.COM")).toBe("1.2.3.4:admin@example.com");
    expect(rateLimitKey(undefined, "a")).toBe("unknown:a");
  });
});