import type { Metadata } from "next";
import { UsersManager } from "@/components/admin/users-manager";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Users & Roles" };
export default function Page() { return <UsersManager />; }
