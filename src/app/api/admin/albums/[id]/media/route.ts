import { NextRequest } from "next/server";
import { ok, errorResponse, validateOrThrow } from "@/lib/api/response";
import { requireAuth, requirePermission } from "@/lib/auth/rbac";
import { setAlbumMedia, albumMediaIds } from "@/lib/services/media";
import { assertSameOrigin } from "@/lib/api/origin";
import { logActivity } from "@/lib/services/activity";
import { clientIp } from "@/lib/api/origin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ mediaIds: z.array(z.coerce.number().int().positive()) });

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, context: Ctx) {
  try {
    assertSameOrigin(req);
    const actor = await requirePermission("gallery.manage");
    const { id } = await context.params;
    const { mediaIds } = validateOrThrow(schema, await req.json());
    setAlbumMedia(Number(id), mediaIds);
    logActivity({
      userId: actor.id,
      action: "albums.set_media",
      entityType: "album",
      entityId: Number(id),
      details: { count: mediaIds.length },
      ip: clientIp(req),
    });
    return ok({ mediaIds: albumMediaIds(Number(id)) });
  } catch (e) {
    return errorResponse(e);
  }
}
