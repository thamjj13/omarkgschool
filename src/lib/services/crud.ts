import { getDb, bindValue } from "../db/client";
import { slugify, uniqueSlug, nowIso, clampInt } from "../utils";
import { sanitizeHtmlContent } from "../utils/sanitize";

export interface CrudConfig {
  /** Database table name. */
  table: string;
  /** Primary key column. */
  idField?: string;
  /** Columns matched by the free-text `q` search. */
  searchColumns?: string[];
  /** Columns that can be filtered by exact match via `?<column>=value`. */
  filterColumns?: string[];
  /** Columns allowed as sort keys. */
  sortableColumns?: string[];
  defaultSort?: { column: string; dir: "asc" | "desc" };
  /** Columns accepted on create/update (allow-list against mass assignment). */
  writableColumns: string[];
  /** Auto-generate a slug into this column from the `slugSource` field. */
  slugColumn?: string;
  slugSource?: string;
  /** Columns whose value should be sanitised as rich HTML before write. */
  sanitizeColumns?: string[];
  /** Transform the validated input before writing (e.g. compute fields). */
  transform?: (
    input: Record<string, unknown>,
    ctx: "create" | "update"
  ) => Record<string, unknown>;
  /** Hook run after delete (e.g. remove files). */
  onDelete?: (id: number) => void;
  /** Extra SELECT fields appended to every read (aliases/computations). */
  selectExtra?: string;
  /** Extra FROM/JOIN clause. */
  joinClause?: string;
}

export interface ListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: string;
  dir?: "asc" | "desc";
  filters?: Record<string, string>;
}

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function ensureUniqueSlug(
  cfg: CrudConfig,
  base: string,
  excludeId?: number
): string {
  const db = getDb();
  const col = cfg.slugColumn!;
  return uniqueSlug(base, (s) => {
    const row = db
      .prepare(`SELECT 1 FROM ${cfg.table} WHERE ${col} = ? AND ${cfg.idField ?? "id"} != ?`)
      .get(s, excludeId ?? -1);
    return Boolean(row);
  });
}

function prepareWrite(
  cfg: CrudConfig,
  input: Record<string, unknown>,
  ctx: "create" | "update",
  id?: number
): { columns: string[]; values: unknown[] } {
  let data = { ...input };
  if (cfg.transform) data = cfg.transform(data, ctx);

  const columns: string[] = [];
  const values: unknown[] = [];

  for (const key of Object.keys(data)) {
    if (!cfg.writableColumns.includes(key)) continue;
    if (data[key] === undefined) continue;
    let value: unknown = data[key];
    if (cfg.sanitizeColumns?.includes(key) && typeof value === "string") {
      value = sanitizeHtmlContent(value);
    }
    columns.push(key);
    values.push(bindValue(value));
  }

  // slug handling
  if (cfg.slugColumn && cfg.writableColumns.includes(cfg.slugColumn)) {
    const provided = data[cfg.slugColumn] as string | undefined;
    const source = (data[cfg.slugSource ?? "title"] as string) || (cfg.slugSource ? "" : "item");
    if (provided && typeof provided === "string" && provided.trim()) {
      const final = ensureUniqueSlug(cfg, provided, id);
      const idx = columns.indexOf(cfg.slugColumn);
      if (idx >= 0) values[idx] = final;
      else {
        columns.push(cfg.slugColumn);
        values.push(final);
      }
    } else if (source) {
      const final = ensureUniqueSlug(cfg, source, id);
      const idx = columns.indexOf(cfg.slugColumn);
      if (idx >= 0) values[idx] = final;
      else {
        columns.push(cfg.slugColumn);
        values.push(final);
      }
    }
  }

  return { columns, values };
}

function buildWhere(
  cfg: CrudConfig,
  q: string | undefined,
  filters: Record<string, string> | undefined
): { where: string; params: unknown[] } {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (q && cfg.searchColumns?.length) {
    const like = `%${q.replace(/[%_]/g, "\\$&")}%`;
    const parts = cfg.searchColumns.map((c) => `${cfg.table}.${c} LIKE ? ESCAPE '\\'`);
    clauses.push(`(${parts.join(" OR ")})`);
    cfg.searchColumns.forEach(() => params.push(like));
  }

  if (filters && cfg.filterColumns) {
    for (const col of cfg.filterColumns) {
      const value = filters[col];
      if (value === undefined || value === "" || value === "all") continue;
      clauses.push(`${cfg.table}.${col} = ?`);
      params.push(value);
    }
  }

  return { where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", params };
}

export function createCrud<T extends Record<string, unknown>>(cfg: CrudConfig) {
  const idField = cfg.idField ?? "id";
  const table = cfg.table;

  function selectParts(): string {
    const extra = cfg.selectExtra ? `, ${cfg.selectExtra}` : "";
    return `${table}.*${extra}`;
  }

  function list(query: ListQuery = {}): ListResult<T> {
    const db = getDb();
    const page = clampInt(query.page, 1, 100000, 1);
    const pageSize = clampInt(query.pageSize, 1, 100, 20);
    const q = query.q?.trim();

    const { where, params } = buildWhere(cfg, q, query.filters);

    const totalRow = db
      .prepare(`SELECT COUNT(*) AS n FROM ${table} ${cfg.joinClause ?? ""} ${where}`)
      .get(...params) as { n: number };

    const sortable = cfg.sortableColumns ?? [];
    let sortCol = cfg.defaultSort?.column ?? idField;
    if (query.sort && sortable.includes(query.sort)) sortCol = query.sort;
    const dir = query.dir === "asc" ? "ASC" : "DESC";
    const orderBy = `ORDER BY ${table}.${sortCol} ${dir}, ${table}.${idField} DESC`;

    const items = db
      .prepare(
        `SELECT ${selectParts()} FROM ${table} ${cfg.joinClause ?? ""} ${where} ${orderBy} LIMIT ? OFFSET ?`
      )
      .all(...params, pageSize, (page - 1) * pageSize) as T[];

    const total = totalRow.n;
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  function get(id: number): T | null {
    const db = getDb();
    return (
      (db
        .prepare(`SELECT ${selectParts()} FROM ${table} ${cfg.joinClause ?? ""} WHERE ${table}.${idField} = ?`)
        .get(id) as T | undefined) ?? null
    );
  }

  function create(input: Record<string, unknown>): T {
    const db = getDb();
    const { columns, values } = prepareWrite(cfg, input, "create");
    columns.push("created_at", "updated_at");
    values.push(nowIso(), nowIso());
    const result = db
      .prepare(
        `INSERT INTO ${table} (${columns.map((c) => c).join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`
      )
      .run(...values);
    return get(Number(result.lastInsertRowid))!;
  }

  function update(id: number, input: Record<string, unknown>): T {
    const db = getDb();
    const { columns, values } = prepareWrite(cfg, input, "update", id);
    if (columns.length === 0) return get(id)!;
    columns.push("updated_at");
    values.push(nowIso());
    const set = columns.map((c) => `${c} = ?`).join(", ");
    db.prepare(`UPDATE ${table} SET ${set} WHERE ${idField} = ?`).run(...values, id);
    return get(id)!;
  }

  function remove(id: number): void {
    const db = getDb();
    db.prepare(`DELETE FROM ${table} WHERE ${idField} = ?`).run(id);
    cfg.onDelete?.(id);
  }

  function countWhere(column: string, value: string): number {
    const db = getDb();
    const row = db
      .prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${column} = ?`)
      .get(value) as { n: number };
    return row.n;
  }

  function exists(column: string, value: unknown, excludeId?: number): boolean {
    const db = getDb();
    const row = db
      .prepare(`SELECT 1 FROM ${table} WHERE ${column} = ? AND ${idField} != ? LIMIT 1`)
      .get(value, excludeId ?? -1);
    return Boolean(row);
  }

  function slugifyValue(source: string): string {
    return slugify(source);
  }

  return { cfg, list, get, create, update, remove, countWhere, exists, slugifyValue };
}

export type CrudService<T extends Record<string, unknown> = Record<string, unknown>> =
  ReturnType<typeof createCrud<T>>;
