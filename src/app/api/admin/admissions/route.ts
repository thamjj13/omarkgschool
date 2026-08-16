import { NextRequest } from "next/server";
import { ok, errorResponse } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/rbac";
import { listAdmissions } from "@/lib/services/forms";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("admissions.manage");
    const url = new URL(req.url);
    return ok(
      listAdmissions({
        page: Number(url.searchParams.get("page") ?? 1),
        pageSize: Number(url.searchParams.get("pageSize") ?? 20),
        q: url.searchParams.get("q") ?? undefined,
        status: url.searchParams.get("status") ?? undefined,
      })
    );
  } catch (e) {
    return errorResponse(e);
  }
}
