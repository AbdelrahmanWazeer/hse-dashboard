#!/usr/bin/env node
/**
 * Cron entrypoint for scheduled report delivery.
 *
 * Usage:
 *   CRON_SECRET=... node scripts/run-cron.mjs
 *
 * Hits /api/cron/reports with the bearer token. Supports CRON_URL to
 * override the target (defaults to the production script's origin envs).
 */
const url = process.env.CRON_URL ?? process.env.DEPLOY_URL ?? `http://localhost:${process.env.PORT ?? "3000"}`;
const secret = process.env.CRON_SECRET;

if (!secret) {
  console.error("CRON_SECRET is not set.");
  process.exit(1);
}

const base = url.replace(/\/+$/, "");
const res = await fetch(`${base}/api/cron/reports`, {
  headers: { authorization: `Bearer ${secret}` },
});

const body = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error(`cron failed (${res.status}):`, body);
  process.exit(1);
}
console.log(`cron ok — ${body.processed?.length ?? 0} report(s) processed.`);
for (const r of body.processed ?? []) {
  console.log(`  ${r.ok ? "sent " : "FAIL "} ${r.title} -> ${r.to}${r.detail ? ` (${r.detail})` : ""}`);
}