import { NextRequest } from "next/server";
import { ok, errorResponse, validateOrThrow } from "@/lib/api/response";
import { requireAuth, requirePermission } from "@/lib/auth/rbac";
import { updateUser, deleteUser } from "@/lib/services/users";
import { userUpdateSchema } from "@/lib/validators";
import { assertSameOrigin } from "@/lib/api/origin";
import { logActivity } from "@/lib/services/activity";
import { clientIp } from "@/lib/api/origin";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: Ctx) {
  try {
    assertSameOrigin(req);
    const actor = await requirePermission("users.manage");
    const { id } = await context.params;
    const input = validateOrThrow(userUpdateSchema, await req.json());
    const updated = await updateUser(Number(id), input, actor.id);
    logActivity({
      userId: actor.id,
      action: "users.update",
      entityType: "user",
      entityId: Number(id),
      ip: clientIp(req),
    });
    return ok(updated);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: NextRequest, context: Ctx) {
  try {
    assertSameOrigin(req);
    const actor = await requirePermission("users.manage");
    const { id } = await context.params;
    deleteUser(Number(id), actor.id);
    logActivity({
      userId: actor.id,
      action: "users.delete",
      entityType: "user",
      entityId: Number(id),
      ip: clientIp(req),
    });
    return ok({ id: Number(id) });
  } catch (e) {
    return errorResponse(e);
  }
}
