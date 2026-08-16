import type { Metadata } from "next";
import { SettingsManager } from "@/components/admin/settings-manager";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Site Settings" };
export default function Page() { return <SettingsManager />; }
