import type { Metadata } from "next";
import { MediaLibrary } from "@/components/admin/media-library";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Media Library" };
export default function Page() { return <MediaLibrary />; }
