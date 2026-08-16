import { NextRequest } from "next/server";
import { ok, errorResponse, validateOrThrow } from "@/lib/api/response";
import { forgotPasswordSchema } from "@/lib/validators";
import { getUserByEmail } from "@/lib/services/users";
import { createPasswordResetToken } from "@/lib/auth/tokens";
import { sendMail } from "@/lib/services/mail";
import { rateLimit } from "@/lib/api/rate-limit";
import { clientIp } from "@/lib/api/origin";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`forgot:${ip}`, { windowMs: 15 * 60_000, max: 5 });
    if (!rl.allowed) {
      return ok({
        message: "If an account exists for that email, a reset link has been sent.",
      });
    }

    const input = validateOrThrow(forgotPasswordSchema, await req.json());
    const user = getUserByEmail(input.email);

    // Always return the same response to avoid leaking which emails exist.
    let resetUrl: string | null = null;
    if (user) {
      const token = createPasswordResetToken(user.id);
      resetUrl = `${req.nextUrl.origin}/admin/reset-password?token=${token}`;
      await sendMail(
        user.email,
        "Reset your Maplebrook Academy password",
        `Hi ${user.name},\n\nWe received a request to reset your password.\n\nUse the link below to choose a new password (valid for 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.\n\n— Maplebrook International Academy`
      );
    }

    // In development (no SMTP) surface the link so the flow is fully testable.
    const body: Record<string, unknown> = {
      message: "If an account exists for that email, a reset link has been sent.",
    };
    if (!config.isProd && resetUrl) body.resetUrl = resetUrl;

    return ok(body);
  } catch (e) {
    return errorResponse(e);
  }
}
