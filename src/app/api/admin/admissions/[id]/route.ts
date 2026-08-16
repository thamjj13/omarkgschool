import { NextRequest } from "next/server";
import { ok, errorResponse, validateOrThrow } from "@/lib/api/response";
import { requireAuth, requirePermission } from "@/lib/auth/rbac";
import { setAdmissionStatus, deleteAdmission } from "@/lib/services/forms";
import { assertSameOrigin } from "@/lib/api/origin";
import { logActivity } from "@/lib/services/activity";
import { clientIp } from "@/lib/api/origin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const statusSchema = z.object({
  status: z.enum(["pending", "reviewing", "accepted", "rejected"]),
  review_notes: z.string().max(2000).optional().or(z.literal("")),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: Ctx) {
  try {
    assertSameOrigin(req);
    const actor = await requirePermission("admissions.manage");
    const { id } = await context.params;
    const input = validateOrThrow(statusSchema, await req.json());
    const row = setAdmissionStatus(Number(id), input.status, input.review_notes ?? "", actor.id);
    logActivity({
      userId: actor.id,
      action: "admissions.status",
      entityType: "admission",
      entityId: row.id,
      details: { status: row.status },
      ip: clientIp(req),
    });
    return ok(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: NextRequest, context: Ctx) {
  try {
    assertSameOrigin(req);
    const actor = await requirePermission("admissions.manage");
    const { id } = await context.params;
    deleteAdmission(Number(id));
    logActivity({ userId: actor.id, action: "admissions.delete", entityType: "admission", entityId: Number(id), ip: clientIp(req) });
    return ok({ id: Number(id) });
  } catch (e) {
    return errorResponse(e);
  }
}
