import { NextRequest } from "next/server";
import { ok, errorResponse, validateOrThrow } from "@/lib/api/response";
import { newsletterSchema } from "@/lib/validators";
import { subscribeNewsletter } from "@/lib/services/forms";
import { rateLimit } from "@/lib/api/rate-limit";
import { clientIp } from "@/lib/api/origin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`newsletter:${clientIp(req)}`, { windowMs: 10 * 60_000, max: 5 });
    if (!rl.allowed) {
      return errorResponse({ status: 429, message: "Too many requests. Please try again later.", code: "RATE_LIMITED" });
    }
    const input = validateOrThrow(newsletterSchema, await req.json().catch(() => ({})));
    const { created } = subscribeNewsletter(input.email);
    return ok({
      success: true,
      message: created ? "Thanks for subscribing!" : "You're already on our list.",
    });
  } catch (e) {
    return errorResponse(e);
  }
}
