import { ok, fail, errorResponse, validateOrThrow } from "@/lib/api/response";
import { profileUpdateSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth/rbac";
import { getUserByEmail } from "@/lib/services/users";
import { verifyPassword } from "@/lib/auth/password";
import { updateUser } from "@/lib/services/users";
import { logActivity } from "@/lib/services/activity";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const input = validateOrThrow(profileUpdateSchema, await req.json());

    const full = getUserByEmail(user.email);
    if (!full) return fail(401, "Not authenticated", "UNAUTHORIZED");

    if (input.password) {
      if (!input.current_password) {
        return fail(422, "Current password is required to set a new password", "VALIDATION", {
          current_password: ["Current password is required"],
        });
      }
      const valid = await verifyPassword(input.current_password, full.password_hash);
      if (!valid) {
        return fail(422, "Current password is incorrect", "VALIDATION", {
          current_password: ["Current password is incorrect"],
        });
      }
    }

    const updated = await updateUser(
      user.id,
      { name: input.name, ...(input.password ? { password: input.password } : {}) },
      user.id
    );
    logActivity({ userId: user.id, action: "auth.change_password", entityType: "user", entityId: user.id });
    return ok({ id: updated!.id, name: updated!.name, email: updated!.email });
  } catch (e) {
    return errorResponse(e);
  }
}
