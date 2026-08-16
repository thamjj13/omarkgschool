import { NextRequest } from "next/server";
import { ok, errorResponse, validateOrThrow } from "@/lib/api/response";
import { contactSchema } from "@/lib/validators";
import { submitContact } from "@/lib/services/forms";
import { rateLimit } from "@/lib/api/rate-limit";
import { clientIp } from "@/lib/api/origin";
import { logActivity } from "@/lib/services/activity";
import { sendMail } from "@/lib/services/mail";
import { siteSettings } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`contact:${ip}`, { windowMs: 10 * 60_000, max: 5 });
    if (!rl.allowed) {
      return errorResponse({ status: 429, message: "Too many submissions. Please try again later.", code: "RATE_LIMITED" });
    }

    const form = await req.formData().catch(() => new FormData());
    // Honeypot: bots fill hidden fields; humans never do.
    if (String(form.get("website") ?? "").length > 0) {
      return ok({ success: true });
    }

    const input = validateOrThrow(contactSchema, {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      subject: String(form.get("subject") ?? ""),
      message: String(form.get("message") ?? ""),
    });

    const row = submitContact({
      name: input.name,
      email: input.email,
      phone: input.phone ?? "",
      subject: input.subject ?? "",
      message: input.message,
    });

    const s = siteSettings();
    await sendMail(
      s.email,
      `New contact message: ${input.subject || "General enquiry"}`,
      `From: ${input.name} <${input.email}>\nPhone: ${input.phone || "—"}\n\n${input.message}`
    );

    logActivity({ action: "contact.submit", entityType: "message", entityId: row.id, ip });
    return ok({ success: true, message: "Thank you! Your message has been sent." }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
