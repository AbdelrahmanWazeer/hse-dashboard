import { sqlite } from "./index";
import { copyFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), ".data");
const BACKUP_DIR = join(process.cwd(), "backups");
const maxBackups = Number(process.env.BACKUP_KEEP ?? "10");

const suffix = new Date().toISOString().replace(/[:.]/g, "-");
const src = join(DATA_DIR, "hse.db");
const dest = join(BACKUP_DIR, `hse-${suffix}.db`);

if (!existsSync(src)) {
  console.error("Database not found:", src);
  process.exit(1);
}

mkdirSync(BACKUP_DIR, { recursive: true });

sqlite.pragma("wal_checkpoint(TRUNCATE)");
copyFileSync(src, dest);
console.log(`Backup written: ${dest}`);

const backups = readdirSync(BACKUP_DIR)
  .filter((f) => f.startsWith("hse-") && f.endsWith(".db"))
  .sort();
while (backups.length > maxBackups) {
  const old = backups.shift();
  if (old) {
    unlinkSync(join(BACKUP_DIR, old));
    console.log(`Pruned old backup: ${old}`);
  }
}