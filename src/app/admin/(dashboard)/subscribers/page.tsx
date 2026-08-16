import type { Metadata } from "next";
import { SubscribersManager } from "@/components/admin/subscribers-manager";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Subscribers" };
export default function Page() { return <SubscribersManager />; }
