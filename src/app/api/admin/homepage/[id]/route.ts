import { NextRequest } from "next/server";
import { ok, errorResponse, validateOrThrow } from "@/lib/api/response";
import { requireAuth, requirePermission } from "@/lib/auth/rbac";
import { saveHomepageSection } from "@/lib/services/settings";
import { homepageSectionSchema } from "@/lib/validators";
import { assertSameOrigin } from "@/lib/api/origin";
import { logActivity } from "@/lib/services/activity";
import { clientIp } from "@/lib/api/origin";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: Ctx) {
  try {
    assertSameOrigin(req);
    const actor = await requirePermission("settings.manage");
    const { id } = await context.params;
    const input = validateOrThrow(homepageSectionSchema.partial(), await req.json());
    const section = saveHomepageSection(Number(id), input);
    logActivity({ userId: actor.id, action: "homepage.update", entityType: "homepage", entityId: section.id, ip: clientIp(req) });
    return ok(section);
  } catch (e) {
    return errorResponse(e);
  }
}
