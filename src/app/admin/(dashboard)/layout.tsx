import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { permissionsForUser } from "@/lib/auth/rbac";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  const permissions = [...permissionsForUser(user.id)];
  return <AdminShell user={{ ...user, permissions }}>{children}</AdminShell>;
}
