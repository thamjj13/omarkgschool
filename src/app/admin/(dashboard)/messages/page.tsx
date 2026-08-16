import type { Metadata } from "next";
import { MessagesManager } from "@/components/admin/messages-manager";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Messages" };
export default function Page() { return <MessagesManager />; }
