import { ok, errorResponse } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/rbac";
import { listRoles, listPermissions } from "@/lib/services/users";
import { ROLE_DEFINITIONS } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePermission("users.manage");
    return ok({
      roles: listRoles(),
      permissions: listPermissions(),
      roleDefinitions: ROLE_DEFINITIONS,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
