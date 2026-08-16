import type { Metadata } from "next";
import { AlbumsManager } from "@/components/admin/albums-manager";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gallery Albums" };
export default function Page() { return <AlbumsManager />; }
