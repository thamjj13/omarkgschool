import type { Metadata } from "next";
import { HomepageManager } from "@/components/admin/homepage-manager";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Homepage Sections" };
export default function Page() { return <HomepageManager />; }
