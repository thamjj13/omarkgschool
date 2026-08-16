import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { config } from "../config";
import { getDb } from "../db/client";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: string; // role slug
  roleName: string;
}

interface JwtPayload {
  sub: string; // user id
  role: string;
  name: string;
}

function key(): Uint8Array {
  return new TextEncoder().encode(config.authSecret);
}

export async function signSession(user: {
  id: number;
  name: string;
  role: string;
}): Promise<string> {
  return new SignJWT({ role: user.role, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setIssuer(config.siteUrl)
    .setAudience("maplebrook-admin")
    .setExpirationTime(`${config.sessionMaxAgeSeconds}s`)
    .sign(key());
}

export async function verifySessionToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key(), {
      issuer: config.siteUrl,
      audience: "maplebrook-admin",
    });
    return {
      sub: String(payload.sub ?? ""),
      role: String(payload.role ?? ""),
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}

/** Read + verify the session cookie and return the live user from the DB. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(config.sessionCookieName)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const db = getDb();
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.status, r.slug AS role, r.name AS roleName
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.id = ?`
    )
    .get(Number(payload.sub)) as
    | { id: number; name: string; email: string; status: string; role: string; roleName: string }
    | undefined;

  if (!row || row.status !== "active") return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    roleName: row.roleName,
  };
}

/** Set the session cookie. Must be called within a request scope. */
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(config.sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProd,
    path: "/",
    maxAge: config.sessionMaxAgeSeconds,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(config.sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProd,
    path: "/",
    maxAge: 0,
  });
}

export const SESSION_COOKIE = config.sessionCookieName;
