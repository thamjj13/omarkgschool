import { NextRequest } from "next/server";
import { ok, errorResponse } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/rbac";
import { listSubscribers } from "@/lib/services/forms";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("messages.manage");
    const url = new URL(req.url);
    return ok(
      listSubscribers({
        page: Number(url.searchParams.get("page") ?? 1),
        pageSize: Number(url.searchParams.get("pageSize") ?? 25),
        q: url.searchParams.get("q") ?? undefined,
      })
    );
  } catch (e) {
    return errorResponse(e);
  }
}
