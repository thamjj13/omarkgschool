import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Mission } from "@/components/home/sections";
import { listEnabledHomepageSections } from "@/lib/services/settings";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Mission, Vision & Values", description: "The purpose and values that guide Maplebrook International Academy." };
}

export default function MissionPage() {
  const mission = listEnabledHomepageSections().find((x) => x.type === "mission");

  return (
    <>
      <PageHeader
        title="Mission, Vision & Values"
        subtitle="The principles that guide every lesson, every decision and every day."
        crumb="about"
      />
      {mission ? (
        <Mission section={mission} />
      ) : (
        <section className="mx-auto max-w-3xl px-6 py-20 text-ink-500">
          Mission content will appear here once configured.
        </section>
      )}
    </>
  );
}
