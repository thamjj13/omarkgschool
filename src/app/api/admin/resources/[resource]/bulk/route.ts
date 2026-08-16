import { NextRequest } from "next/server";
import { ok, errorResponse, validateOrThrow } from "@/lib/api/response";
import { bulkDeleteResource } from "@/lib/admin/engine";
import { requireAuth } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/api/origin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bulkSchema = z.object({ ids: z.array(z.coerce.number().int().positive()).min(1) });

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ resource: string }> }
) {
  try {
    assertSameOrigin(req);
    const { resource } = await context.params;
    const user = await requireAuth();
    const { ids } = validateOrThrow(bulkSchema, await req.json());
    return ok(await bulkDeleteResource(resource, ids, user, req));
  } catch (e) {
    return errorResponse(e);
  }
}
