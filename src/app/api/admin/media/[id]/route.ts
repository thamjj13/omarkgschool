import { NextRequest } from "next/server";
import { ok, errorResponse } from "@/lib/api/response";
import { requireAuth, requirePermission } from "@/lib/auth/rbac";
import { updateMediaMeta, deleteMedia, getMedia } from "@/lib/services/media";
import { assertSameOrigin } from "@/lib/api/origin";
import { logActivity } from "@/lib/services/activity";
import { clientIp } from "@/lib/api/origin";
import { ApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: Ctx) {
  try {
    assertSameOrigin(req);
    const actor = await requirePermission("media.manage");
    const { id } = await context.params;
    const body = (await req.json()) as { alt_text?: string; caption?: string; is_public?: number };
    const media = updateMediaMeta(Number(id), {
      alt_text: body.alt_text,
      caption: body.caption,
      is_public: body.is_public != null ? Number(body.is_public) : undefined,
    });
    logActivity({ userId: actor.id, action: "media.update", entityType: "media", entityId: media.id, ip: clientIp(req) });
    return ok(media);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: NextRequest, context: Ctx) {
  try {
    assertSameOrigin(req);
    const actor = await requirePermission("media.manage");
    const { id } = await context.params;
    const media = getMedia(Number(id));
    if (!media) throw new ApiError(404, "Media not found", "NOT_FOUND");
    deleteMedia(Number(id));
    logActivity({
      userId: actor.id,
      action: "media.delete",
      entityType: "media",
      entityId: Number(id),
      details: { name: media.original_name },
      ip: clientIp(req),
    });
    return ok({ id: Number(id) });
  } catch (e) {
    return errorResponse(e);
  }
}
