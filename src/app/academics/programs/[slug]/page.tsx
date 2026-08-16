import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MediaImg } from "@/components/media-img";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { getProgramBySlug, listPrograms } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProgramBySlug(slug);
  return {
    title: p ? p.name : "Program",
    description: p ? p.short_description : undefined,
  };
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = getProgramBySlug(slug);
  if (!program) notFound();
  const others = listPrograms().filter((p) => p.slug !== slug).slice(0, 3);

  const facts: { label: string; value: string }[] = [];
  if (program.grade_level) facts.push({ label: "Grade level", value: program.grade_level });
  if (program.duration) facts.push({ label: "Duration", value: program.duration });
  if (program.curriculum) facts.push({ label: "Curriculum", value: program.curriculum });
  if (program.capacity) facts.push({ label: "Capacity", value: `${program.capacity} students` });
  if (program.department_name) facts.push({ label: "Department", value: program.department_name });

  return (
    <>
      <section className="relative overflow-hidden bg-ink-950 py-20 text-white">
        {program.image_id && <MediaImg id={program.image_id} alt={program.name} eager className="absolute inset-0 h-full w-full opacity-25" />}
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/80 to-ink-950/40" />
        <div className="relative mx-auto max-w-6xl px-6">
          <nav className="mb-4 flex items-center gap-1.5 text-xs font-medium text-ink-300">
            <Link href="/" className="hover:text-white">Home</Link>
            <Icon name="chevron-right" size={13} />
            <Link href="/academics/programs" className="hover:text-white">Programs</Link>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            {program.grade_level && <Badge tone="accent">{program.grade_level}</Badge>}
          </div>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">{program.name}</h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-100">{program.short_description}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink-950">About this program</h2>
            <div className="prose-html mt-4 max-w-none" dangerouslySetInnerHTML={{ __html: program.description || "<p>More details coming soon.</p>" }} />
          </div>
          <aside>
            <div className="rounded-2xl border border-ink-100 bg-ink-50 p-6">
              <h3 className="font-display text-base font-semibold text-ink-950">Quick facts</h3>
              <dl className="mt-4 space-y-3">
                {facts.map((f) => (
                  <div key={f.label} className="flex justify-between gap-3 text-sm">
                    <dt className="text-ink-500">{f.label}</dt>
                    <dd className="text-right font-medium text-ink-900">{f.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6">
                <Button href="/admissions/apply" className="w-full">Apply now</Button>
              </div>
            </div>
          </aside>
        </div>

        {others.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-2xl font-semibold text-ink-950">Other programs</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {others.map((p) => (
                <Link
                  key={p.id}
                  href={`/academics/programs/${p.slug}`}
                  className="rounded-xl border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 hover:border-brand-400 hover:text-brand-700"
                >
                  {p.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
