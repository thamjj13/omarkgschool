import { NextRequest } from "next/server";
import { ok, errorResponse } from "@/lib/api/response";
import { getResourceItem, updateResourceItem, deleteResourceItem } from "@/lib/admin/engine";
import { requireAuth } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/api/origin";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ resource: string; id: string }> };

export async function GET(req: NextRequest, context: Ctx) {
  try {
    const { resource, id } = await context.params;
    return ok(await getResourceItem(resource, Number(id)));
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PATCH(req: NextRequest, context: Ctx) {
  try {
    assertSameOrigin(req);
    const { resource, id } = await context.params;
    const user = await requireAuth();
    const body = await req.json().catch(() => ({}));
    return ok(await updateResourceItem(resource, Number(id), body, user, req));
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: NextRequest, context: Ctx) {
  try {
    assertSameOrigin(req);
    const { resource, id } = await context.params;
    const user = await requireAuth();
    return ok(await deleteResourceItem(resource, Number(id), user, req));
  } catch (e) {
    return errorResponse(e);
  }
}
