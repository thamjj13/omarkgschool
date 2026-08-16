import { NextRequest } from "next/server";
import { ok, errorResponse, validateOrThrow } from "@/lib/api/response";
import { requireAuth, requirePermission } from "@/lib/auth/rbac";
import { listHomepageSections, saveHomepageSection } from "@/lib/services/settings";
import { assertSameOrigin } from "@/lib/api/origin";
import { logActivity } from "@/lib/services/activity";
import { clientIp } from "@/lib/api/origin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const reorderSchema = z.object({
  sections: z.array(
    z.object({ id: z.coerce.number().int(), display_order: z.coerce.number().int(), enabled: z.coerce.boolean() })
  ),
});

export async function GET() {
  try {
    await requirePermission("settings.manage");
    return ok({ sections: listHomepageSections() });
  } catch (e) {
    return errorResponse(e);
  }
}

/** Bulk update order + visibility of homepage sections. */
export async function PUT(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const actor = await requirePermission("settings.manage");
    const { sections } = validateOrThrow(reorderSchema, await req.json());
    for (const s of sections) {
      saveHomepageSection(s.id, { display_order: s.display_order, enabled: s.enabled ? 1 : 0 });
    }
    logActivity({ userId: actor.id, action: "homepage.reorder", entityType: "homepage", entityId: null, ip: clientIp(req) });
    return ok({ sections: listHomepageSections() });
  } catch (e) {
    return errorResponse(e);
  }
}
