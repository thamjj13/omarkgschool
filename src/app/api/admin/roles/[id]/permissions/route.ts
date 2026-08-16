import { NextRequest } from "next/server";
import { ok, errorResponse, validateOrThrow } from "@/lib/api/response";
import { requireAuth, requirePermission } from "@/lib/auth/rbac";
import { rolePermissions, setRolePermissions } from "@/lib/services/users";
import { assertSameOrigin } from "@/lib/api/origin";
import { logActivity } from "@/lib/services/activity";
import { clientIp } from "@/lib/api/origin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ permissions: z.array(z.string().min(2)) });

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: Ctx) {
  try {
    await requirePermission("users.manage");
    const { id } = await context.params;
    return ok({ permissions: rolePermissions(Number(id)) });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req: NextRequest, context: Ctx) {
  try {
    assertSameOrigin(req);
    const actor = await requirePermission("users.manage");
    const { id } = await context.params;
    const { permissions } = validateOrThrow(schema, await req.json());
    setRolePermissions(Number(id), permissions);
    logActivity({
      userId: actor.id,
      action: "roles.update_permissions",
      entityType: "role",
      entityId: Number(id),
      details: { permissions },
      ip: clientIp(req),
    });
    return ok({ permissions: rolePermissions(Number(id)) });
  } catch (e) {
    return errorResponse(e);
  }
}
