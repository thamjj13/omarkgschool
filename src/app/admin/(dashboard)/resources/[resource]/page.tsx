import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResourceManager } from "@/components/admin/resource-manager";
import { getResource } from "@/lib/admin/resources";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: Promise<{ resource: string }> }): Metadata {
  // Dynamic metadata is resolved inside the component for simplicity.
  return { title: "Manage content" };
}

export default async function ResourcePage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const def = getResource(resource);
  if (!def) notFound();
  return <ResourceManager resource={resource} />;
}
