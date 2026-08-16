import fs from "node:fs";
import { config } from "../src/lib/config";
import { closeDb, getDb } from "../src/lib/db/client";
import { hashPassword } from "../src/lib/auth/password";
import { PERMISSIONS, ROLE_DEFINITIONS } from "../src/lib/auth/rbac";

/** Delete and recreate the test database with a fresh schema. */
export function freshDb() {
  closeDb();
  for (const suffix of ["", "-wal", "-shm"]) {
    try {
      fs.rmSync(config.databasePath + suffix, { force: true });
    } catch {
      /* ignore */
    }
  }
  getDb(); // reopens + runs migrations
  return getDb();
}

/** Seed roles, permissions and a user; returns the user id. Idempotent. */
export async function seedUser(
  roleSlug: string,
  email = `${roleSlug}@test.dev`,
  password = "Password1"
): Promise<number> {
  const db = getDb();
  const roleId = seedRole(roleSlug);
  const hash = await hashPassword(password);
  db.prepare("DELETE FROM users WHERE email = ?").run(email);
  const res = db
    .prepare("INSERT INTO users (name, email, password_hash, role_id, status) VALUES (?, ?, ?, ?, 'active')")
    .run("Test User", email, hash, roleId);
  return Number(res.lastInsertRowid);
}

/** Seed permissions and a single role (idempotent). Returns the role id. */
export function seedRole(roleSlug: string): number {
  const db = getDb();
  for (const p of PERMISSIONS) {
    db.prepare("INSERT OR IGNORE INTO permissions (slug, name, resource) VALUES (?, ?, ?)").run(p.slug, p.name, p.resource);
  }
  const roleDef = ROLE_DEFINITIONS.find((r) => r.slug === roleSlug)!;
  db.prepare("INSERT OR IGNORE INTO roles (slug, name) VALUES (?, ?)").run(roleSlug, roleDef.name);
  const roleId = (db.prepare("SELECT id FROM roles WHERE slug = ?").get(roleSlug) as { id: number }).id;

  const permId: Record<string, number> = {};
  for (const p of PERMISSIONS) {
    permId[p.slug] = (db.prepare("SELECT id FROM permissions WHERE slug = ?").get(p.slug) as { id: number }).id;
  }
  db.prepare("DELETE FROM role_permissions WHERE role_id = ?").run(roleId);
  for (const slug of roleDef.permissions) {
    db.prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)").run(roleId, permId[slug]);
  }
  return roleId;
}
