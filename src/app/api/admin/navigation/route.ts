import { NextRequest } from "next/server";
import { ok, errorResponse, validateOrThrow } from "@/lib/api/response";
import { requireAuth, requirePermission } from "@/lib/auth/rbac";
import { listAllNavigation, createNavigationItem } from "@/lib/services/settings";
import { navigationItemSchema } from "@/lib/validators";
import { assertSameOrigin } from "@/lib/api/origin";
import { logActivity } from "@/lib/services/activity";
import { clientIp } from "@/lib/api/origin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePermission("settings.manage");
    return ok({ items: listAllNavigation() });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const actor = await requirePermission("settings.manage");
    const input = validateOrThrow(navigationItemSchema, await req.json());
    const item = createNavigationItem(input);
    logActivity({ userId: actor.id, action: "navigation.create", entityType: "navigation", entityId: item.id, ip: clientIp(req) });
    return ok(item, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
