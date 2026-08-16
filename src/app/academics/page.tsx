import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ProgramCard } from "@/components/cards";
import { Icon, type IconName } from "@/components/ui/icon";
import { SectionHeading } from "@/components/ui/primitives";
import { listPrograms, listDepartments } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Academics", description: "Explore the academic programs and departments at Maplebrook International Academy." };
}

export default function AcademicsPage() {
  const programs = listPrograms();
  const departments = listDepartments();

  return (
    <>
      <PageHeader
        title="Academics"
        subtitle="From playful Early Years to the rigorous IB Diploma, our curriculum grows with every child."
        crumb="academics"
      />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading eyebrow="Programs" title="Pathways for every age" subtitle="Six carefully designed stages of learning." />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p, i) => (
            <ProgramCard key={p.id} item={p} index={i} />
          ))}
        </div>
      </section>

      <section className="bg-ink-50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading eyebrow="Departments" title="Our academic departments" subtitle="Specialist faculties that bring each subject to life." />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((d) => (
              <Link
                key={d.id}
                href={`/academics/departments#${d.slug}`}
                className="group rounded-2xl border border-ink-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <Icon name={(d.icon as IconName) || "book-open"} size={22} />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink-950 group-hover:text-brand-700">{d.name}</h3>
                <p className="mt-1.5 text-sm text-ink-500">{d.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
