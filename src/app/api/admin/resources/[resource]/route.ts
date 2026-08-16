import { NextRequest } from "next/server";
import { ok, errorResponse } from "@/lib/api/response";
import { listResource, createResourceItem } from "@/lib/admin/engine";
import { requireAuth } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/api/origin";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ resource: string }> }
) {
  try {
    const { resource } = await context.params;
    return ok(await listResource(resource, req));
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ resource: string }> }
) {
  try {
    assertSameOrigin(req);
    const { resource } = await context.params;
    const user = await requireAuth();
    const body = await req.json().catch(() => ({}));
    return ok(await createResourceItem(resource, body, user, req), { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
