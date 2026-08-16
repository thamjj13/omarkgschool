import { NextRequest } from "next/server";
import { ok, errorResponse, validateOrThrow } from "@/lib/api/response";
import { requireAuth, requirePermission } from "@/lib/auth/rbac";
import { getAllSettings, saveSettings } from "@/lib/services/settings";
import { siteSettingsSchema } from "@/lib/validators";
import { assertSameOrigin } from "@/lib/api/origin";
import { logActivity } from "@/lib/services/activity";
import { clientIp } from "@/lib/api/origin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePermission("settings.manage");
    return ok({ settings: getAllSettings() });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const actor = await requirePermission("settings.manage");
    const body = await req.json();
    const settings = validateOrThrow(siteSettingsSchema, body.settings ?? body);
    saveSettings(settings);
    logActivity({ userId: actor.id, action: "settings.update", entityType: "settings", entityId: null, ip: clientIp(req) });
    return ok({ settings: getAllSettings() });
  } catch (e) {
    return errorResponse(e);
  }
}
