import { getDb } from "../db/client";
import { clampInt } from "../utils";

export interface ActivityInput {
  userId?: number | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  details?: unknown;
  ip?: string;
}

export function logActivity(input: ActivityInput): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    input.userId ?? null,
    input.action,
    input.entityType,
    input.entityId != null ? String(input.entityId) : null,
    input.details != null ? JSON.stringify(input.details) : null,
    input.ip ?? null
  );
}

export interface ActivityRow {
  id: number;
  user_id: number | null;
  user_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string | null;
  ip: string | null;
  created_at: string;
}

export function listActivity(query: {
  page?: number;
  pageSize?: number;
  q?: string;
  action?: string;
}): { items: ActivityRow[]; total: number; page: number; pageSize: number; totalPages: number } {
  const db = getDb();
  const page = clampInt(query.page, 1, 100000, 1);
  const pageSize = clampInt(query.pageSize, 1, 100, 25);

  const clauses: string[] = [];
  const params: unknown[] = [];
  if (query.q) {
    clauses.push(
      "(a.action LIKE ? OR a.entity_type LIKE ? OR u.name LIKE ? OR u.email LIKE ?)"
    );
    const like = `%${query.q}%`;
    params.push(like, like, like, like);
  }
  if (query.action && query.action !== "all") {
    clauses.push("a.action = ?");
    params.push(query.action);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const total = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM activity_logs a LEFT JOIN users u ON u.id = a.user_id ${where}`
      )
      .get(...params) as { n: number }
  ).n;

  const items = db
    .prepare(
      `SELECT a.*, u.name AS user_name
       FROM activity_logs a LEFT JOIN users u ON u.id = a.user_id
       ${where}
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, (page - 1) * pageSize) as ActivityRow[];

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
