import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ProgramCard } from "@/components/cards";
import { listPrograms } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Academic Programs", description: "Academic programs from Early Years to the IB Diploma." };
}

export default function ProgramsPage() {
  const programs = listPrograms();
  return (
    <>
      <PageHeader title="Academic Programs" subtitle="Every stage of learning, designed around how children grow." crumb="academics" />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p, i) => (
            <ProgramCard key={p.id} item={p} index={i} />
          ))}
        </div>
      </section>
    </>
  );
}
