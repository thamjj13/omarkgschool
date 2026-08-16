import { NextRequest } from "next/server";
import { ok, errorResponse, validateOrThrow } from "@/lib/api/response";
import { requireAuth, requirePermission } from "@/lib/auth/rbac";
import { getAlbum, updateAlbum, deleteAlbum } from "@/lib/services/media";
import { galleryAlbumSchema } from "@/lib/validators";
import { assertSameOrigin } from "@/lib/api/origin";
import { logActivity } from "@/lib/services/activity";
import { clientIp } from "@/lib/api/origin";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: Ctx) {
  try {
    await requirePermission("gallery.manage");
    const { id } = await context.params;
    const album = getAlbum(Number(id));
    if (!album) return errorResponse({ status: 404, message: "Album not found" });
    return ok(album);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PATCH(req: NextRequest, context: Ctx) {
  try {
    assertSameOrigin(req);
    const actor = await requirePermission("gallery.manage");
    const { id } = await context.params;
    const input = validateOrThrow(galleryAlbumSchema.partial(), await req.json());
    const album = updateAlbum(Number(id), input);
    logActivity({ userId: actor.id, action: "albums.update", entityType: "album", entityId: album.id, ip: clientIp(req) });
    return ok(album);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: NextRequest, context: Ctx) {
  try {
    assertSameOrigin(req);
    const actor = await requirePermission("gallery.manage");
    const { id } = await context.params;
    deleteAlbum(Number(id));
    logActivity({ userId: actor.id, action: "albums.delete", entityType: "album", entityId: Number(id), ip: clientIp(req) });
    return ok({ id: Number(id) });
  } catch (e) {
    return errorResponse(e);
  }
}
