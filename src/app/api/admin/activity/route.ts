import { NextRequest } from "next/server";
import { ok, errorResponse } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/rbac";
import { listActivity } from "@/lib/services/activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("activity.view");
    const url = new URL(req.url);
    return ok(
      listActivity({
        page: Number(url.searchParams.get("page") ?? 1),
        pageSize: Number(url.searchParams.get("pageSize") ?? 25),
        q: url.searchParams.get("q") ?? undefined,
        action: url.searchParams.get("action") ?? undefined,
      })
    );
  } catch (e) {
    return errorResponse(e);
  }
}
