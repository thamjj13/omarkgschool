import crypto from "node:crypto";
import { getDb } from "../db/client";

/** Hash a plaintext token for storage (we never store raw tokens). */
export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export interface ResetToken {
  user_id: number;
  expires_at: string;
}

export function createPasswordResetToken(userId: number, ttlHours = 1): string {
  const db = getDb();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();
  db.prepare(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`
  ).run(userId, sha256(token), expiresAt);
  return token;
}

/** Validate and consume a reset token. Returns user id, or null if invalid. */
export function consumePasswordResetToken(token: string): number | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, user_id, expires_at, used_at FROM password_reset_tokens
       WHERE token_hash = ? ORDER BY id DESC LIMIT 1`
    )
    .get(sha256(token)) as
    | { id: number; user_id: number; expires_at: string; used_at: string | null }
    | undefined;
  if (!row) return null;
  if (row.used_at) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  db.prepare(`UPDATE password_reset_tokens SET used_at = ? WHERE id = ?`).run(
    new Date().toISOString(),
    row.id
  );
  return row.user_id;
}
