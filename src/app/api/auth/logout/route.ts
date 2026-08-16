import { ok, errorResponse } from "@/lib/api/response";
import { clearSessionCookie, getSessionUser } from "@/lib/auth/session";
import { logActivity } from "@/lib/services/activity";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (user) {
      logActivity({
        userId: user.id,
        action: "auth.logout",
        entityType: "user",
        entityId: user.id,
      });
    }
    await clearSessionCookie();
    return ok({ success: true });
  } catch (e) {
    return errorResponse(e);
  }
}
