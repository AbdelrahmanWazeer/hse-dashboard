/**
 * Minimal structured logger. Writes JSON lines to `logs/app.log` when
 * LOG_FILE=1 and always emits to console. Safe to import anywhere.
 */
import "server-only";
import { appendFileSync, mkdirSync } from "fs";
import { join } from "path";

const enabled = process.env.LOG_FILE === "1";

function write(level: string, message: string, extra?: Record<string, unknown>) {
  const line = JSON.stringify({
    t: new Date().toISOString(),
    level,
    msg: message,
    ...(extra ?? {}),
  });
  if (enabled) {
    try {
      const dir = join(process.cwd(), "logs");
      mkdirSync(dir, { recursive: true });
      appendFileSync(join(dir, "app.log"), line + "\n");
    } catch {
      /* logging must never crash the request */
    }
  }
  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (message: string, extra?: Record<string, unknown>) => write("info", message, extra),
  warn: (message: string, extra?: Record<string, unknown>) => write("warn", message, extra),
  error: (message: string, extra?: Record<string, unknown>) => write("error", message, extra),
};