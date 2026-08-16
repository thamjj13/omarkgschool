import { fail, ok, errorResponse } from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return fail(401, "Not authenticated", "UNAUTHORIZED");
    return ok(user);
  } catch (e) {
    return errorResponse(e);
  }
}
