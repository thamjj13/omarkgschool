import fs from "node:fs";
import { Readable } from "node:stream";
import { NextRequest } from "next/server";
import { errorResponse } from "@/lib/api/response";
import { getDocument, incrementDownload } from "@/lib/services/media";
import { absolutePath } from "@/lib/upload";
import { getSessionUser } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const doc = getDocument(Number(id)) as
      | {
          id: number;
          title: string;
          is_public: number;
          storage_path: string;
          original_name: string;
          mime_type: string;
        }
      | undefined;
    if (!doc) throw new ApiError(404, "Document not found", "NOT_FOUND");

    if (!doc.is_public) {
      const user = await getSessionUser();
      if (!user) throw new ApiError(403, "This document is private", "FORBIDDEN");
    }

    const abs = absolutePath(doc.storage_path);
    if (!fs.existsSync(abs)) throw new ApiError(404, "File not found on disk", "NOT_FOUND");

    incrementDownload(doc.id);
    const stat = fs.statSync(abs);
    const stream = Readable.toWeb(fs.createReadStream(abs)) as ReadableStream;
    const filename = encodeURIComponent(doc.original_name);

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": doc.mime_type || "application/octet-stream",
        "Content-Length": String(stat.size),
        "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
        "Cache-Control": doc.is_public ? "public, max-age=3600" : "private, no-store",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
