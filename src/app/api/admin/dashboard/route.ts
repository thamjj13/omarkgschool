import { ok, errorResponse } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/rbac";
import { dashboardStats, recentActivity, admissionsByStatus, messagesByStatus } from "@/lib/services/dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePermission("dashboard.view");
    return ok({
      stats: dashboardStats(),
      recentActivity: recentActivity(10),
      admissionsByStatus: admissionsByStatus(),
      messagesByStatus: messagesByStatus(),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
