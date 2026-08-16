import { ok, fail, errorResponse, validateOrThrow } from "@/lib/api/response";
import { resetPasswordSchema } from "@/lib/validators";
import { consumePasswordResetToken } from "@/lib/auth/tokens";
import { getUser, updateUser } from "@/lib/services/users";
import { hashPassword } from "@/lib/auth/password";
import { getDb } from "@/lib/db/client";
import { logActivity } from "@/lib/services/activity";
import { rateLimit } from "@/lib/api/rate-limit";
import { clientIp } from "@/lib/api/origin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const rl = rateLimit(`reset:${clientIp(req)}`, { windowMs: 15 * 60_000, max: 10 });
    if (!rl.allowed) return fail(429, "Too many attempts. Please try again later.", "RATE_LIMITED");

    const input = validateOrThrow(resetPasswordSchema, await req.json());
    const userId = consumePasswordResetToken(input.token);
    if (!userId) {
      return fail(400, "This reset link is invalid or has expired.", "INVALID_TOKEN");
    }
    const user = getUser(userId);
    if (!user) return fail(404, "User not found", "NOT_FOUND");

    getDb()
      .prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
      .run(await hashPassword(input.password), userId);

    logActivity({ userId, action: "auth.reset_password", entityType: "user", entityId: userId });
    return ok({ message: "Your password has been reset. You can now sign in." });
  } catch (e) {
    return errorResponse(e);
  }
}
