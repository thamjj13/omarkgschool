import type { Metadata } from "next";
import { NavigationManager } from "@/components/admin/navigation-manager";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Navigation" };
export default function Page() { return <NavigationManager />; }
