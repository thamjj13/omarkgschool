import type { Metadata } from "next";
import { ActivityLog } from "@/components/admin/activity-log";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Activity Log" };
export default function Page() { return <ActivityLog />; }
