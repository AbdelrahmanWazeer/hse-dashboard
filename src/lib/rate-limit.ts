/**
 * Small, dependency-free in-memory sliding-window rate limiter.
 * Suitable for single-process deployments (the default `next start`).
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export type RateLimitCheck = { ok: boolean; remaining: number; retryAfterMs: number };

export type RateLimitOptions = {
  limit?: number;
  windowMs?: number;
  now?: number;
};

function prune(windowMs: number, now: number) {
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export function checkRateLimit(key: string, options: RateLimitOptions = {}): RateLimitCheck {
  const { limit = 5, windowMs = 15 * 60 * 1000, now = Date.now() } = options;
  if (limit <= 0) return { ok: false, remaining: 0, retryAfterMs: windowMs };

  let entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }
  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  if (store.size > 10_000) {
    prune(windowMs, now);
  }
  return { ok: entry.count <= limit, remaining, retryAfterMs: Math.max(0, entry.resetAt - now) };
}

export function resetRateLimit(key: string) {
  store.delete(key);
}

export function rateLimitKey(ip: string | undefined, account: string): string {
  return `${ip ?? "unknown"}:${account.toLowerCase().trim()}`;
}