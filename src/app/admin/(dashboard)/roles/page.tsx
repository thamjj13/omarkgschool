import type { Metadata } from "next";
import { RolesManager } from "@/components/admin/roles-manager";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Roles & Permissions" };
export default function Page() { return <RolesManager />; }
