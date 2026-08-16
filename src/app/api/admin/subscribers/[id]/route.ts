import { NextRequest } from "next/server";
import { ok, errorResponse, validateOrThrow } from "@/lib/api/response";
import { requireAuth, requirePermission } from "@/lib/auth/rbac";
import { setSubscriberStatus } from "@/lib/services/forms";
import { getDb } from "@/lib/db/client";
import { assertSameOrigin } from "@/lib/api/origin";
import { logActivity } from "@/lib/services/activity";
import { clientIp } from "@/lib/api/origin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ status: z.enum(["subscribed", "unsubscribed"]) });

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: Ctx) {
  try {
    assertSameOrigin(req);
    const actor = await requirePermission("messages.manage");
    const { id } = await context.params;
    const { status } = validateOrThrow(schema, await req.json());
    setSubscriberStatus(Number(id), status);
    logActivity({ userId: actor.id, action: "subscribers.update", entityType: "subscriber", entityId: Number(id), ip: clientIp(req) });
    return ok({ id: Number(id), status });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: NextRequest, context: Ctx) {
  try {
    assertSameOrigin(req);
    const actor = await requirePermission("messages.manage");
    const { id } = await context.params;
    getDb().prepare("DELETE FROM newsletter_subscribers WHERE id = ?").run(Number(id));
    logActivity({ userId: actor.id, action: "subscribers.delete", entityType: "subscriber", entityId: Number(id), ip: clientIp(req) });
    return ok({ id: Number(id) });
  } catch (e) {
    return errorResponse(e);
  }
}
