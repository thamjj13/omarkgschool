import { NextRequest } from "next/server";
import { ok, errorResponse, validateOrThrow } from "@/lib/api/response";
import { requireAuth, requirePermission } from "@/lib/auth/rbac";
import { listAlbums, createAlbum } from "@/lib/services/media";
import { galleryAlbumSchema } from "@/lib/validators";
import { assertSameOrigin } from "@/lib/api/origin";
import { logActivity } from "@/lib/services/activity";
import { clientIp } from "@/lib/api/origin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePermission("gallery.manage");
    const albums = listAlbums();
    return ok({ items: albums, total: albums.length });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const actor = await requirePermission("gallery.manage");
    const input = validateOrThrow(galleryAlbumSchema, await req.json());
    const album = createAlbum(input);
    logActivity({ userId: actor.id, action: "albums.create", entityType: "album", entityId: album.id, ip: clientIp(req) });
    return ok(album, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
