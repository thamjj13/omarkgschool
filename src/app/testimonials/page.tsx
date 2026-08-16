import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Avatar, Stars } from "@/components/cards";
import { Badge } from "@/components/ui/primitives";
import { listTestimonials } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Testimonials", description: "What parents, students and alumni say about Maplebrook International Academy." };
}

export default function TestimonialsPage() {
  const testimonials = listTestimonials();

  return (
    <>
      <PageHeader title="Testimonials" subtitle="What our parents, students and alumni say about us." crumb="testimonials" />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="columns-1 gap-6 md:columns-2 lg:columns-3 [&>*]:mb-6">
          {testimonials.map((t) => (
            <figure key={t.id} className="break-inside-avoid rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
              <Stars rating={t.rating} />
              <blockquote className="mt-3 text-ink-700">“{t.quote}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <Avatar name={t.name} mediaId={t.photo_id} className="h-11 w-11 text-sm" />
                <div>
                  <p className="text-sm font-semibold text-ink-900">{t.name}</p>
                  <p className="text-xs text-ink-500">{t.role_title}</p>
                </div>
                {t.affiliation && <Badge tone="brand" className="ml-auto">{t.affiliation}</Badge>}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </>
  );
}
