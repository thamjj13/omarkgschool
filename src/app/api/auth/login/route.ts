import { NextRequest } from "next/server";
import { ok, fail, errorResponse, validateOrThrow } from "@/lib/api/response";
import { loginSchema } from "@/lib/validators";
import { getUserByEmail, touchLastLogin } from "@/lib/services/users";
import { verifyPassword, DUMMY_HASH } from "@/lib/auth/password";
import { signSession, setSessionCookie } from "@/lib/auth/session";
import { rateLimit } from "@/lib/api/rate-limit";
import { clientIp } from "@/lib/api/origin";
import { logActivity } from "@/lib/services/activity";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`login:${ip}`, { windowMs: 60_000, max: 10 });
    if (!rl.allowed) {
      return fail(
        429,
        `Too many login attempts. Please try again in ${rl.retryAfterSeconds}s.`,
        "RATE_LIMITED"
      );
    }

    const input = validateOrThrow(loginSchema, await req.json());
    const user = getUserByEmail(input.email);

    // Equalise timing whether or not the account exists.
    const matches = user
      ? await verifyPassword(input.password, user.password_hash)
      : await verifyPassword(input.password, DUMMY_HASH);

    if (!user || !matches) {
      return fail(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }
    if (user.status !== "active") {
      return fail(403, "This account has been deactivated", "INACTIVE");
    }

    touchLastLogin(user.id);
    const token = await signSession({ id: user.id, name: user.name, role: user.role });
    await setSessionCookie(token);
    logActivity({
      userId: user.id,
      action: "auth.login",
      entityType: "user",
      entityId: user.id,
      ip,
    });

    return ok({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleName: user.roleName,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
