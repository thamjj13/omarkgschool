import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Avatar, Stars } from "@/components/cards";
import { Icon } from "@/components/ui/icon";
import { SectionHeading } from "@/components/ui/primitives";
import { listAlumni, listTestimonials } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Alumni", description: "Meet the alumni of Maplebrook International Academy." };
}

export default function AlumniPage() {
  const alumni = listAlumni();
  const testimonials = listTestimonials().filter((t) => t.affiliation === "Alumnus");

  return (
    <>
      <PageHeader title="Alumni" subtitle="Proud graduates making their mark across the world." crumb="alumni" />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {alumni.map((a) => (
            <div key={a.id} className="flex flex-col rounded-2xl border border-ink-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-card">
              <div className="flex items-center gap-4">
                <Avatar name={a.name} mediaId={a.photo_id} className="h-16 w-16 text-xl" />
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink-950">{a.name}</h2>
                  <p className="text-sm text-brand-600">Class of {a.graduation_year}</p>
                </div>
              </div>
              <div className="mt-4 flex-1">
                {a.current_role && <p className="text-sm font-medium text-ink-900">{a.current_role}</p>}
                {a.employer && <p className="text-sm text-ink-500">{a.employer}</p>}
                {a.bio && <div className="prose-html mt-2 text-sm" dangerouslySetInnerHTML={{ __html: a.bio }} />}
              </div>
              {a.linkedin && (
                <a
                  href={a.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  <Icon name="linkedin" size={16} /> LinkedIn
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="bg-ink-50 py-16">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeading align="left" eyebrow="In their words" title="Alumni voices" />
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {testimonials.map((t) => (
                <blockquote key={t.id} className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
                  <Stars rating={t.rating} />
                  <p className="mt-3 text-ink-700">“{t.quote}”</p>
                  <footer className="mt-3 text-sm font-medium text-ink-900">{t.name}</footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
