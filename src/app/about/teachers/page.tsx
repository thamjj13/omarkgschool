import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { TeacherCard } from "@/components/cards";
import { EmptyState } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { listTeachers, listDepartments } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Our Teachers", description: "Meet the dedicated educators of Maplebrook International Academy." };
}

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string }>;
}) {
  const sp = await searchParams;
  const active = sp.department ?? "all";
  const departments = listDepartments();
  const teachers = listTeachers({ department: active });

  return (
    <>
      <PageHeader
        title="Our Teachers & Staff"
        subtitle="Dedicated educators who know every child by name and inspire them to aim higher."
        crumb="about"
      />
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/about/teachers"
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              active === "all" ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-700 hover:bg-ink-200"
            )}
          >
            All
          </Link>
          {departments.map((d) => (
            <Link
              key={d.id}
              href={`/about/teachers?department=${d.slug}`}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                active === d.slug ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-700 hover:bg-ink-200"
              )}
            >
              {d.name}
            </Link>
          ))}
        </div>

        {teachers.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {teachers.map((t) => (
              <TeacherCard key={t.id} item={t} />
            ))}
          </div>
        ) : (
          <div className="mt-10">
            <EmptyState icon="users" title="No teachers found" description="Try selecting a different department." />
          </div>
        )}
      </section>
    </>
  );
}
