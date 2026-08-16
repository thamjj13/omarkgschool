import { ApiError } from "./errors";

/**
 * Same-origin verification for state-changing requests.
 * Combined with SameSite=Lax cookies this mitigates CSRF: browsers do not
 * attach Lax cookies to cross-site POSTs, and any cross-origin request that
 * somehow arrives with a cookie will also fail this Origin check.
 */
export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  if (!origin) return; // same-origin non-browser clients may omit Origin
  const host = req.headers.get("host");
  if (!host) return;
  try {
    const originHost = new URL(origin).host;
    if (originHost !== host) {
      throw new ApiError(403, "Cross-origin request rejected", "CSRF");
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(403, "Cross-origin request rejected", "CSRF");
  }
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
