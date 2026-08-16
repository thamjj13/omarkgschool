import { NextRequest } from "next/server";
import { ok, errorResponse, validateOrThrow } from "@/lib/api/response";
import { requireAuth, requirePermission } from "@/lib/auth/rbac";
import { listUsers, createUser } from "@/lib/services/users";
import { userCreateSchema } from "@/lib/validators";
import { assertSameOrigin } from "@/lib/api/origin";
import { logActivity } from "@/lib/services/activity";
import { clientIp } from "@/lib/api/origin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("users.manage");
    const url = new URL(req.url);
    const result = listUsers({
      page: Number(url.searchParams.get("page") ?? 1),
      pageSize: Number(url.searchParams.get("pageSize") ?? 20),
      q: url.searchParams.get("q") ?? undefined,
      role: url.searchParams.get("role") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
    });
    return ok(result);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const user = await requirePermission("users.manage");
    const input = validateOrThrow(userCreateSchema, await req.json());
    const created = await createUser(input);
    logActivity({
      userId: user.id,
      action: "users.create",
      entityType: "user",
      entityId: created!.id,
      details: { email: created!.email },
      ip: clientIp(req),
    });
    return ok(created, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
