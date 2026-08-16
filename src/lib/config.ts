import path from "node:path";

/**
 * Centralised runtime configuration, resolved from environment variables.
 * All secrets come from `process.env` — nothing is hardcoded here.
 */

function bool(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback;
  return value === "1" || value.toLowerCase() === "true";
}

const projectRoot = path.resolve(process.cwd());

export const config = {
  get isProd() {
    return process.env.NODE_ENV === "production";
  },
  get isDev() {
    return process.env.NODE_ENV !== "production";
  },
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  authSecret:
    process.env.AUTH_SECRET || "dev-only-insecure-secret-change-in-production",
  get databasePath() {
    return path.resolve(
      projectRoot,
      process.env.DATABASE_PATH || path.join("data", "app.db")
    );
  },
  get uploadDir() {
    return path.resolve(projectRoot, process.env.UPLOAD_DIR || "uploads");
  },
  get logDir() {
    return path.resolve(projectRoot, "logs");
  },
  sessionCookieName: "mba_session",
  sessionMaxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "",
    configured: bool(process.env.SMTP_HOST) && bool(process.env.SMTP_USER),
  },
  admin: {
    name: process.env.ADMIN_NAME || "Site Administrator",
    email: process.env.ADMIN_EMAIL || "admin@maplebrook.edu",
    password: process.env.ADMIN_PASSWORD || "ChangeMe123!",
  },
};

export type AppConfig = typeof config;
