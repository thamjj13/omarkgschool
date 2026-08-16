import type { Metadata } from "next";
import { AdmissionsManager } from "@/components/admin/admissions-manager";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admissions" };
export default function Page() { return <AdmissionsManager />; }
