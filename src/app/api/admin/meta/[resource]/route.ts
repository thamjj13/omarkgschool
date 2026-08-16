import { NextRequest } from "next/server";
import { ok, errorResponse } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/rbac";
import { getResourceMeta } from "@/lib/admin/meta";
import { getResource } from "@/lib/admin/resources";
import { ApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, context: { params: Promise<{ resource: string }> }) {
  try {
    const { resource } = await context.params;
    const def = getResource(resource);
    if (!def) throw new ApiError(404, "Unknown resource", "NOT_FOUND");
    await requirePermission(def.permission);
    return ok(getResourceMeta(resource));
  } catch (e) {
    return errorResponse(e);
  }
}
