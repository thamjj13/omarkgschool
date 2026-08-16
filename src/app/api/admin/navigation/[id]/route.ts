import { NextRequest } from "next/server";
import { ok, errorResponse, validateOrThrow } from "@/lib/api/response";
import { requireAuth, requirePermission } from "@/lib/auth/rbac";
import { updateNavigationItem, deleteNavigationItem } from "@/lib/services/settings";
import { navigationItemSchema } from "@/lib/validators";
import { assertSameOrigin } from "@/lib/api/origin";
import { logActivity } from "@/lib/services/activity";
import { clientIp } from "@/lib/api/origin";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: Ctx) {
  try {
    assertSameOrigin(req);
    const actor = await requirePermission("settings.manage");
    const { id } = await context.params;
    const input = validateOrThrow(navigationItemSchema.partial(), await req.json());
    const item = updateNavigationItem(Number(id), input);
    logActivity({ userId: actor.id, action: "navigation.update", entityType: "navigation", entityId: item.id, ip: clientIp(req) });
    return ok(item);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: NextRequest, context: Ctx) {
  try {
    assertSameOrigin(req);
    const actor = await requirePermission("settings.manage");
    const { id } = await context.params;
    deleteNavigationItem(Number(id));
    logActivity({ userId: actor.id, action: "navigation.delete", entityType: "navigation", entityId: Number(id), ip: clientIp(req) });
    return ok({ id: Number(id) });
  } catch (e) {
    return errorResponse(e);
  }
}
