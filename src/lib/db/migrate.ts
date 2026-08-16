import fs from "node:fs";
import path from "node:path";
import { logger } from "../logger";
import type { Db } from "./client";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "db", "migrations");

/**
 * Tiny, dependency-free migration runner.
 * - Reads numbered `.sql` files from /db/migrations in order.
 * - Records applied migrations in the `_migrations` table.
 * - Applies each migration inside a transaction.
 */
export function runMigrations(db: Db): void {
  fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });

  db.exec(
    `CREATE TABLE IF NOT EXISTS _migrations (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       name TEXT NOT NULL UNIQUE,
       applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
     )`
  );

  const appliedRows = db.prepare("SELECT name FROM _migrations").all() as { name: string }[];
  const applied = new Set(appliedRows.map((r) => r.name));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const insert = db.prepare("INSERT INTO _migrations (name) VALUES (?)");

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    logger.info(`Applying migration ${file}`);
    // Use a raw transaction (withTransaction uses getDb's cached connection,
    // which isn't available yet during bootstrap).
    db.exec("BEGIN");
    try {
      db.exec(sql);
      insert.run(file);
      db.exec("COMMIT");
    } catch (e) {
      try {
        db.exec("ROLLBACK");
      } catch {
        /* ignore */
      }
      throw e;
    }
  }
}
