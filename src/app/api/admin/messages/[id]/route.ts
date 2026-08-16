import { NextRequest } from "next/server";
import { ok, errorResponse, validateOrThrow } from "@/lib/api/response";
import { requireAuth, requirePermission } from "@/lib/auth/rbac";
import { updateContactStatus, deleteContact } from "@/lib/services/forms";
import { assertSameOrigin } from "@/lib/api/origin";
import { logActivity } from "@/lib/services/activity";
import { clientIp } from "@/lib/api/origin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ status: z.enum(["unread", "read", "responded"]) });

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: Ctx) {
  try {
    assertSameOrigin(req);
    const actor = await requirePermission("messages.manage");
    const { id } = await context.params;
    const { status } = validateOrThrow(schema, await req.json());
    const row = updateContactStatus(Number(id), status);
    logActivity({ userId: actor.id, action: "messages.status", entityType: "message", entityId: row.id, ip: clientIp(req) });
    return ok(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: NextRequest, context: Ctx) {
  try {
    assertSameOrigin(req);
    const actor = await requirePermission("messages.manage");
    const { id } = await context.params;
    deleteContact(Number(id));
    logActivity({ userId: actor.id, action: "messages.delete", entityType: "message", entityId: Number(id), ip: clientIp(req) });
    return ok({ id: Number(id) });
  } catch (e) {
    return errorResponse(e);
  }
}
