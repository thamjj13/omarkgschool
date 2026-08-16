import { NextRequest } from "next/server";
import { ok, errorResponse, validateOrThrow } from "@/lib/api/response";
import { admissionSchema } from "@/lib/validators";
import { submitAdmission } from "@/lib/services/forms";
import { rateLimit } from "@/lib/api/rate-limit";
import { clientIp } from "@/lib/api/origin";
import { logActivity } from "@/lib/services/activity";
import { sendMail } from "@/lib/services/mail";
import { siteSettings } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`admission:${ip}`, { windowMs: 10 * 60_000, max: 5 });
    if (!rl.allowed) {
      return errorResponse({ status: 429, message: "Too many submissions. Please try again later.", code: "RATE_LIMITED" });
    }

    const form = await req.formData().catch(() => new FormData());
    if (String(form.get("website") ?? "").length > 0) {
      return ok({ success: true });
    }

    const input = validateOrThrow(admissionSchema, {
      studentFirstName: String(form.get("studentFirstName") ?? ""),
      studentLastName: String(form.get("studentLastName") ?? ""),
      dateOfBirth: String(form.get("dateOfBirth") ?? ""),
      gender: String(form.get("gender") ?? ""),
      gradeApplyingFor: String(form.get("gradeApplyingFor") ?? ""),
      previousSchool: String(form.get("previousSchool") ?? ""),
      guardianName: String(form.get("guardianName") ?? ""),
      guardianRelation: String(form.get("guardianRelation") ?? ""),
      guardianEmail: String(form.get("guardianEmail") ?? ""),
      guardianPhone: String(form.get("guardianPhone") ?? ""),
      address: String(form.get("address") ?? ""),
      city: String(form.get("city") ?? ""),
      country: String(form.get("country") ?? ""),
      message: String(form.get("message") ?? ""),
    });

    const row = submitAdmission({
      student_first_name: input.studentFirstName,
      student_last_name: input.studentLastName,
      date_of_birth: input.dateOfBirth,
      gender: input.gender,
      grade_applying_for: input.gradeApplyingFor,
      previous_school: input.previousSchool ?? "",
      guardian_name: input.guardianName,
      guardian_relation: input.guardianRelation ?? "",
      guardian_email: input.guardianEmail,
      guardian_phone: input.guardianPhone,
      address: input.address ?? "",
      city: input.city ?? "",
      country: input.country ?? "",
      message: input.message ?? "",
    });

    const s = siteSettings();
    await sendMail(
      s.admissionEmail,
      `New admission application ${row.application_no}`,
      `Application: ${row.application_no}\nStudent: ${row.student_first_name} ${row.student_last_name}\nGrade: ${row.grade_applying_for}\nGuardian: ${row.guardian_name} <${row.guardian_email}>`
    );

    logActivity({ action: "admission.submit", entityType: "admission", entityId: row.id, ip });
    return ok(
      {
        success: true,
        applicationNo: row.application_no,
        message: "Application received! We will contact you shortly.",
      },
      { status: 201 }
    );
  } catch (e) {
    return errorResponse(e);
  }
}
