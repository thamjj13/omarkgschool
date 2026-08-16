import fs from "node:fs";
import { Readable } from "node:stream";
import { NextRequest } from "next/server";
import { errorResponse } from "@/lib/api/response";
import { getMedia } from "@/lib/services/media";
import { absolutePath, thumbPath, fileExists } from "@/lib/upload";
import { getSessionUser } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

const CACHE_IMMUTABLE = "public, max-age=31536000, immutable";
const CACHE_PRIVATE = "private, no-store";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const media = getMedia(Number(id));
    if (!media) throw new ApiError(404, "File not found", "NOT_FOUND");

    // Private files require an authenticated admin.
    if (!media.is_public) {
      const user = await getSessionUser();
      if (!user) throw new ApiError(403, "This file is private", "FORBIDDEN");
    }

    const wantThumb = req.nextUrl.searchParams.get("thumb") === "1";
    let relPath = media.storage_path;
    let mime = media.mime_type;
    if (wantThumb && media.kind === "image") {
      const tp = thumbPath(relPath);
      if (fileExists(tp)) {
        relPath = tp;
        mime = "image/webp";
      }
    }

    const abs = absolutePath(relPath);
    if (!fs.existsSync(abs)) throw new ApiError(404, "File not found on disk", "NOT_FOUND");

    const stat = fs.statSync(abs);
    const stream = Readable.toWeb(fs.createReadStream(abs)) as ReadableStream;

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Length": String(stat.size),
        "Cache-Control": media.is_public ? CACHE_IMMUTABLE : CACHE_PRIVATE,
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
