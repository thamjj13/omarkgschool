import { getDb, withTransaction } from "../db/client";
import { hashPassword } from "../auth/password";
import { clampInt } from "../utils";
import { ApiError } from "../api/errors";

export interface UserRow {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role: string;
  roleName: string;
  status: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export function listUsers(query: {
  page?: number;
  pageSize?: number;
  q?: string;
  role?: string;
  status?: string;
}) {
  const db = getDb();
  const page = clampInt(query.page, 1, 100000, 1);
  const pageSize = clampInt(query.pageSize, 1, 100, 20);

  const clauses: string[] = [];
  const params: unknown[] = [];
  if (query.q) {
    clauses.push("(u.name LIKE ? OR u.email LIKE ?)");
    params.push(`%${query.q}%`, `%${query.q}%`);
  }
  if (query.role && query.role !== "all") {
    clauses.push("r.slug = ?");
    params.push(query.role);
  }
  if (query.status && query.status !== "all") {
    clauses.push("u.status = ?");
    params.push(query.status);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const total = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM users u JOIN roles r ON r.id = u.role_id ${where}`
      )
      .get(...params) as { n: number }
  ).n;

  const items = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role_id, u.status, u.last_login_at, u.created_at, u.updated_at,
              r.slug AS role, r.name AS roleName
       FROM users u JOIN roles r ON r.id = u.role_id
       ${where}
       ORDER BY u.id DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, (page - 1) * pageSize) as UserRow[];

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function getUserByEmail(email: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT u.*, r.slug AS role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = ?`
    )
    .get(email.toLowerCase()) as (UserRow & { password_hash: string }) | undefined;
}

export function getUser(id: number) {
  const db = getDb();
  return db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role_id, u.status, u.last_login_at, u.created_at, u.updated_at,
              r.slug AS role, r.name AS roleName
       FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`
    )
    .get(id) as UserRow | undefined;
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role_id: number;
  status: string;
}) {
  const db = getDb();
  const existing = db.prepare("SELECT 1 FROM users WHERE email = ?").get(input.email.toLowerCase());
  if (existing) throw new ApiError(409, "A user with that email already exists", "DUPLICATE");
  const hash = await hashPassword(input.password);
  const result = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, role_id, status) VALUES (?, ?, ?, ?, ?)`
    )
    .run(input.name, input.email.toLowerCase(), hash, input.role_id, input.status);
  return getUser(Number(result.lastInsertRowid));
}

export async function updateUser(
  id: number,
  input: {
    name?: string;
    email?: string;
    password?: string;
    role_id?: number;
    status?: string;
  },
  actorId: number
) {
  const db = getDb();
  const current = getUser(id);
  if (!current) throw new ApiError(404, "User not found", "NOT_FOUND");

  if (input.email) {
    const dup = db
      .prepare("SELECT 1 FROM users WHERE email = ? AND id != ?")
      .get(input.email.toLowerCase(), id);
    if (dup) throw new ApiError(409, "A user with that email already exists", "DUPLICATE");
  }

  const sets: string[] = [];
  const params: unknown[] = [];
  if (input.name !== undefined) {
    sets.push("name = ?");
    params.push(input.name);
  }
  if (input.email !== undefined) {
    sets.push("email = ?");
    params.push(input.email.toLowerCase());
  }
  if (input.role_id !== undefined) {
    sets.push("role_id = ?");
    params.push(input.role_id);
  }
  if (input.status !== undefined) {
    // Prevent deactivating yourself or the last active super admin.
    if (id === actorId && input.status !== "active") {
      throw new ApiError(400, "You cannot deactivate your own account", "SELF_LOCK");
    }
    sets.push("status = ?");
    params.push(input.status);
  }
  if (input.password) {
    sets.push("password_hash = ?");
    params.push(await hashPassword(input.password));
  }
  if (sets.length) {
    sets.push("updated_at = datetime('now')");
    db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...params, id);
  }
  return getUser(id);
}

export function deleteUser(id: number, actorId: number) {
  const db = getDb();
  if (id === actorId) throw new ApiError(400, "You cannot delete your own account", "SELF_DELETE");
  const row = db
    .prepare(
      `SELECT u.id, r.slug AS role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`
    )
    .get(id) as { id: number; role: string } | undefined;
  if (!row) throw new ApiError(404, "User not found", "NOT_FOUND");
  if (row.role === "super_admin") {
    const count = db
      .prepare(`SELECT COUNT(*) AS n FROM users u JOIN roles r ON r.id = u.role_id WHERE r.slug = 'super_admin' AND u.status = 'active'`)
      .get() as { n: number };
    if (count.n <= 1) {
      throw new ApiError(400, "Cannot delete the last super admin", "LAST_ADMIN");
    }
  }
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
}

export function touchLastLogin(id: number): void {
  getDb()
    .prepare("UPDATE users SET last_login_at = ? WHERE id = ?")
    .run(new Date().toISOString(), id);
}

/* ── roles & permissions ─────────────────────────────────────────────────── */

export function listRoles() {
  return getDb().prepare("SELECT * FROM roles ORDER BY id").all();
}

export function listPermissions() {
  return getDb().prepare("SELECT * FROM permissions ORDER BY resource, id").all();
}

export function rolePermissions(roleId: number): string[] {
  const rows = getDb()
    .prepare(
      `SELECT p.slug FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       WHERE rp.role_id = ?`
    )
    .all(roleId) as { slug: string }[];
  return rows.map((r) => r.slug);
}

export function setRolePermissions(roleId: number, slugs: string[]): void {
  const db = getDb();
  withTransaction(() => {
    db.prepare("DELETE FROM role_permissions WHERE role_id = ?").run(roleId);
    const stmt = db.prepare(
      "INSERT INTO role_permissions (role_id, permission_id) SELECT ?, id FROM permissions WHERE slug = ?"
    );
    for (const slug of slugs) stmt.run(roleId, slug);
  });
}
