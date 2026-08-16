import { describe, it, expect, beforeAll } from "vitest";
import { freshDb, seedRole } from "./helpers";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";
import { signSession, verifySessionToken } from "../src/lib/auth/session";
import { createPasswordResetToken, consumePasswordResetToken, sha256 } from "../src/lib/auth/tokens";
import { getDb } from "../src/lib/db/client";

describe("authentication", () => {
  let roleId = 0;
  beforeAll(() => {
    freshDb();
    roleId = seedRole("editor");
  });

  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("S3cret!Pass");
    expect(hash).not.toBe("S3cret!Pass");
    expect(await verifyPassword("S3cret!Pass", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("signs and verifies session tokens", async () => {
    const token = await signSession({ id: 7, name: "Ada", role: "editor" });
    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe("7");
    expect(payload!.role).toBe("editor");
  });

  it("rejects tampered session tokens", async () => {
    const token = await signSession({ id: 7, name: "Ada", role: "editor" });
    await expect(verifySessionToken(token + "tamper")).resolves.toBeNull();
  });

  it("creates and consumes one-time password reset tokens", async () => {
    const db = getDb();
    const uid = Number(
      db.prepare("INSERT INTO users (name, email, password_hash, role_id) VALUES ('x','x@t.dev','h',?)").run(roleId).lastInsertRowid
    );
    const token = createPasswordResetToken(uid);
    expect(consumePasswordResetToken(token)).toBe(uid);
    // tokens are single-use
    expect(consumePasswordResetToken(token)).toBeNull();
    expect(sha256(token)).not.toBe(token);
  });

  it("rejects expired password reset tokens", async () => {
    const db = getDb();
    const uid = Number(
      db.prepare("INSERT INTO users (name, email, password_hash, role_id) VALUES ('y','y@t.dev','h',?)").run(roleId).lastInsertRowid
    );
    const token = createPasswordResetToken(uid);
    db.prepare("UPDATE password_reset_tokens SET expires_at = ? WHERE user_id = ?").run(
      new Date(Date.now() - 1000).toISOString(),
      uid
    );
    expect(consumePasswordResetToken(token)).toBeNull();
  });
});
