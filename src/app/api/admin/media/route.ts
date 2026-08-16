import { NextRequest } from "next/server";
import { ok, errorResponse } from "@/lib/api/response";
import { requireAuth, requirePermission } from "@/lib/auth/rbac";
import { listMedia, createMedia } from "@/lib/services/media";
import { storeFile } from "@/lib/upload";
import { assertSameOrigin } from "@/lib/api/origin";
import { logActivity } from "@/lib/services/activity";
import { clientIp } from "@/lib/api/origin";
import { ApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("media.manage");
    const url = new URL(req.url);
    return ok(
      listMedia({
        page: Number(url.searchParams.get("page") ?? 1),
        pageSize: Number(url.searchParams.get("pageSize") ?? 24),
        q: url.searchParams.get("q") ?? undefined,
        kind: url.searchParams.get("kind") ?? undefined,
      })
    );
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const actor = await requirePermission("media.manage");

    const form = await req.formData().catch(() => {
      throw new ApiError(400, "Expected multipart/form-data", "INVALID_FORM");
    });
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new ApiError(400, "A file is required", "NO_FILE");
    }

    const stored = await storeFile(file);
    const media = createMedia({
      filename: stored.filename,
      original_name: stored.originalName,
      mime_type: stored.mimeType,
      size_bytes: stored.sizeBytes,
      width: stored.width,
      height: stored.height,
      storage_path: stored.storagePath,
      kind: stored.kind,
      alt_text: String(form.get("alt_text") ?? ""),
      caption: String(form.get("caption") ?? ""),
      is_public: form.get("is_public") === "false" ? 0 : 1,
      uploaded_by: actor.id,
    });

    logActivity({
      userId: actor.id,
      action: "media.upload",
      entityType: "media",
      entityId: media.id,
      details: { name: media.original_name, kind: media.kind },
      ip: clientIp(req),
    });
    return ok(media, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
