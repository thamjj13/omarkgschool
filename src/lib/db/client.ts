import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { config } from "../config";
import { runMigrations } from "./migrate";

/**
 * Facade over `node:sqlite`'s DatabaseSync. We type results as `any` so the
 * service layer is not polluted by SQLite's `SQLOutputValue` union — values
 * are still validated/normalised at the application boundary.
 */
export interface Db {
  exec(sql: string): void;
  prepare(sql: string): {
    run(...params: unknown[]): { changes: number; lastInsertRowid: number };
    get(...params: unknown[]): any;
    all(...params: unknown[]): any[];
  };
  close(): void;
}

declare global {
  // eslint-disable-next-line no-var
  var __mba_db: Db | undefined;
}

/**
 * Normalise a value for binding: `node:sqlite` rejects booleans and
 * `undefined`, so booleans become 0/1 and undefined becomes null.
 */
export function bindValue(v: unknown): null | number | bigint | string | Uint8Array {
  if (v === undefined) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  return v as null | number | bigint | string | Uint8Array;
}

/** Convert `node:sqlite`'s null-prototype rows into plain objects. */
function normalize(row: any): any {
  if (row === null || row === undefined || typeof row !== "object") return row;
  return Object.assign({}, row);
}

function openDatabase(): Db {
  const file = config.databasePath;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const raw = new DatabaseSync(file);
  raw.exec("PRAGMA journal_mode = WAL;");
  raw.exec("PRAGMA foreign_keys = ON;");
  raw.exec("PRAGMA busy_timeout = 5000;");

  const db: Db = {
    exec: (sql) => raw.exec(sql),
    prepare: (sql) => {
      const stmt = raw.prepare(sql);
      return {
        run: (...params) => {
          const r = stmt.run(...(params as any[]));
          return { changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) };
        },
        get: (...params) => normalize(stmt.get(...(params as any[]))),
        all: (...params) => stmt.all(...(params as any[])).map(normalize),
      };
    },
    close: () => raw.close(),
  };
  return db;
}

/** Lazily-created, cached connection (survives HMR in dev). */
export function getDb(): Db {
  if (!globalThis.__mba_db) {
    globalThis.__mba_db = openDatabase();
    runMigrations(globalThis.__mba_db);
  }
  return globalThis.__mba_db;
}

/** Close the cached connection (used by tests/scripts). */
export function closeDb(): void {
  if (globalThis.__mba_db) {
    globalThis.__mba_db.close();
    globalThis.__mba_db = undefined;
  }
}

/** Run a callback inside a transaction (BEGIN/COMMIT/ROLLBACK). */
export function withTransaction<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (e) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw e;
  }
}
