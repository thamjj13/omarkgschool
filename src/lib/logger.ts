import fs from "node:fs";
import path from "node:path";
import { config } from "./config";

type Level = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function levelFromEnv(): Level {
  const v = (process.env.LOG_LEVEL || (config.isProd ? "info" : "debug")).toLowerCase();
  return v === "error" ? "error" : v === "warn" ? "warn" : v === "info" ? "info" : "debug";
}

const threshold = LEVEL_ORDER[levelFromEnv()];

function write(level: Level, message: string, meta?: unknown) {
  if (LEVEL_ORDER[level] < threshold) return;
  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
  // Console output
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(line);
  if (meta !== undefined) {
    try {
      fn(JSON.stringify(meta));
    } catch {
      fn(String(meta));
    }
  }
  // File output (best-effort)
  try {
    fs.mkdirSync(config.logDir, { recursive: true });
    const file = path.join(
      config.logDir,
      `${new Date().toISOString().slice(0, 10)}.log`
    );
    fs.appendFileSync(file, line + "\n");
  } catch {
    // never let logging break the request
  }
}

export const logger = {
  debug: (msg: string, meta?: unknown) => write("debug", msg, meta),
  info: (msg: string, meta?: unknown) => write("info", msg, meta),
  warn: (msg: string, meta?: unknown) => write("warn", msg, meta),
  error: (msg: string, meta?: unknown) => write("error", msg, meta),
};

/**
 * Writes a "sent" email to disk when no SMTP transport is configured,
 * so password-reset and notification flows remain verifiable in dev/demo.
 */
export function logMail(to: string, subject: string, body: string) {
  try {
    fs.mkdirSync(path.join(config.logDir, "mail"), { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const file = path.join(config.logDir, "mail", `${stamp}-${to.replace(/[^a-z0-9@.]/gi, "_")}.txt`);
    fs.writeFileSync(
      file,
      `To: ${to}\nSubject: ${subject}\n\n${body}\n`
    );
  } catch {
    // ignore
  }
  logger.info(`[mail] to=${to} subject="${subject}"`);
}
