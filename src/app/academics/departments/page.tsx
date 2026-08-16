import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Icon, type IconName } from "@/components/ui/icon";
import { listDepartments, listTeachers } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Departments", description: "The academic departments at Maplebrook International Academy." };
}

export default function DepartmentsPage() {
  const departments = listDepartments();
  const teachers = listTeachers();

  return (
    <>
      <PageHeader title="Departments" subtitle="Specialist faculties where deep subject knowledge meets passionate teaching." crumb="academics" />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="space-y-8">
          {departments.map((d) => {
            const members = teachers.filter((t) => t.department_id === d.id);
            return (
              <div key={d.id} id={d.slug} className="scroll-mt-24 rounded-3xl border border-ink-100 bg-white p-8 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                      <Icon name={(d.icon as IconName) || "book-open"} size={26} />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-semibold text-ink-950">{d.name}</h2>
                      <p className="mt-1 max-w-2xl text-sm text-ink-500">{d.description}</p>
                    </div>
                  </div>
                  {members.length > 0 && (
                    <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-600">
                      {members.length} teacher{members.length === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
                {members.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {members.map((m) => (
                      <a
                        key={m.id}
                        href={`/about/teachers/${m.slug}`}
                        className="rounded-full border border-ink-200 px-3.5 py-1.5 text-sm text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-700"
                      >
                        {m.name} · {m.position}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
