import Link from "next/link";
import { MediaImg } from "../media-img";
import { Icon, type IconName } from "../ui/icon";
import { Button } from "../ui/button";
import { SectionHeading } from "../ui/primitives";
import { NewsCard, EventCard, ProgramCard } from "../cards";
import { TestimonialsCarousel } from "./testimonials-carousel";

type Section = {
  id: number;
  key: string;
  type: string;
  title: string;
  subtitle: string;
  body: string;
  media_id: number | null;
};

/* ── hero ──────────────────────────────────────────────────────────────── */

export function Hero({ section, motto, stats }: { section: Section; motto: string; stats: { value: string; label: string; icon: IconName }[] }) {
  return (
    <section className="relative overflow-hidden bg-ink-950 text-white">
      {section.media_id && (
        <MediaImg id={section.media_id} alt={section.title} eager className="absolute inset-0 h-full w-full opacity-35" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/70 to-ink-950/30" />
      <div className="absolute inset-0 bg-grid opacity-40" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:py-32">
        <div className="max-w-2xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent-300 backdrop-blur animate-fade-up">
            <Icon name="sparkles" size={14} /> {motto}
          </p>
          <h1 className="font-display text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl animate-fade-up">
            {section.subtitle || section.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-100 sm:text-lg animate-fade-up">
            {section.body}
          </p>
          <div className="mt-8 flex flex-wrap gap-3 animate-fade-up">
            <Button href="/academics/programs" size="lg">
              Explore Programs <Icon name="arrow-right" size={18} />
            </Button>
            <Button href="/admissions/apply" size="lg" variant="outline" className="border-white/25 bg-white/5 text-white hover:border-white/50 hover:text-white">
              Apply Now
            </Button>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <Icon name={s.icon} size={22} className="text-accent-300" />
              <p className="mt-3 font-display text-3xl font-semibold">{s.value}</p>
              <p className="mt-0.5 text-sm text-ink-200">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── welcome ───────────────────────────────────────────────────────────── */

export function Welcome({ section }: { section: Section }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="relative order-2 lg:order-1">
          {section.media_id ? (
            <div className="overflow-hidden rounded-3xl shadow-soft">
              <MediaImg id={section.media_id} alt={section.title} className="aspect-[4/3] w-full" />
            </div>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-3xl bg-gradient-to-br from-brand-100 to-accent-100">
              <Icon name="building" size={64} className="text-brand-500" />
            </div>
          )}
          <div className="absolute -bottom-6 -right-6 hidden rounded-2xl bg-accent-400 p-5 text-ink-950 shadow-card sm:block">
            <p className="font-display text-3xl font-bold">25+</p>
            <p className="text-xs font-semibold uppercase tracking-wide">Years of excellence</p>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Welcome</p>
          <h2 className="font-display text-3xl font-semibold text-ink-950 sm:text-4xl">{section.title}</h2>
          <div className="prose-html mt-4 text-ink-600" dangerouslySetInnerHTML={{ __html: section.body }} />
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/about" variant="outline">About our school</Button>
            <Button href="/about/principal" variant="ghost">Principal's message <Icon name="arrow-right" size={16} /></Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── stats strip (used inside pages) ───────────────────────────────────── */

export function StatsStrip({ stats }: { stats: { value: string; label: string; icon: IconName }[] }) {
  return (
    <section className="bg-brand-800 text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden px-6 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center py-12 text-center">
            <Icon name={s.icon} size={26} className="text-accent-300" />
            <p className="mt-3 font-display text-4xl font-semibold">{s.value}</p>
            <p className="mt-1 text-sm text-brand-100">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── mission / vision / values ─────────────────────────────────────────── */

export function Mission({ section }: { section: Section }) {
  return (
    <section className="bg-ink-50 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Our Purpose" title={section.title} subtitle={section.subtitle} />
        <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-ink-100 bg-white p-8 shadow-sm sm:p-10">
          <div className="prose-html" dangerouslySetInnerHTML={{ __html: section.body }} />
        </div>
      </div>
    </section>
  );
}

/* ── programs ──────────────────────────────────────────────────────────── */

export function ProgramsSection({ section, programs }: { section: Section; programs: any[] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading align="left" eyebrow="Academics" title={section.title} subtitle={section.subtitle} />
        <Button href="/academics/programs" variant="outline">All programs</Button>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {programs.slice(0, 6).map((p, i) => (
          <ProgramCard key={p.id} item={p} index={i} />
        ))}
      </div>
    </section>
  );
}

/* ── news ──────────────────────────────────────────────────────────────── */

export function NewsSection({ section, news }: { section: Section; news: any[] }) {
  return (
    <section className="bg-ink-50 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading align="left" eyebrow="Newsroom" title={section.title} subtitle={section.subtitle} />
          <Button href="/news" variant="outline">All news</Button>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {news.slice(0, 3).map((n) => (
            <NewsCard key={n.id} item={n} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── events ────────────────────────────────────────────────────────────── */

export function EventsSection({ section, events }: { section: Section; events: any[] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading align="left" eyebrow="Calendar" title={section.title} subtitle={section.subtitle} />
        <Button href="/events" variant="outline">Full calendar</Button>
      </div>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {events.slice(0, 3).map((e) => (
          <EventCard key={e.id} item={e} />
        ))}
      </div>
    </section>
  );
}

/* ── testimonials ──────────────────────────────────────────────────────── */

export function TestimonialsSection({ section, testimonials }: { section: Section; testimonials: any[] }) {
  return (
    <section className="bg-ink-950 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading light eyebrow="Testimonials" title={section.title} subtitle={section.subtitle} />
        <div className="mt-10">
          <TestimonialsCarousel items={testimonials} />
        </div>
      </div>
    </section>
  );
}

/* ── gallery ───────────────────────────────────────────────────────────── */

export function GallerySection({ section, albums }: { section: Section; albums: any[] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading align="left" eyebrow="Gallery" title={section.title} subtitle={section.subtitle} />
        <Button href="/gallery" variant="outline">View gallery</Button>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {albums.slice(0, 4).map((a) => (
          <Link key={a.id} href={`/gallery/${a.slug}`} className="group relative aspect-square overflow-hidden rounded-2xl">
            {a.cover_id ? (
              <MediaImg id={a.cover_id} alt={a.title} thumb className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-100 to-accent-100">
                <Icon name="image" size={40} className="text-brand-500" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <h3 className="font-display text-base font-semibold">{a.title}</h3>
              <p className="text-xs text-ink-200">{a.media_count} photos</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── CTA ───────────────────────────────────────────────────────────────── */

export function CtaSection({ section }: { section: Section }) {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20 lg:pb-24">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 px-8 py-14 text-center text-white sm:px-16 sm:py-16">
        <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-accent-400/10 blur-3xl" />
        <div className="relative">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">{section.title}</h2>
          {section.subtitle && <p className="mt-2 text-brand-100">{section.subtitle}</p>}
          {section.body && <p className="mx-auto mt-3 max-w-xl text-brand-100/90">{section.body}</p>}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/admissions/apply" size="lg" variant="accent">Start Application</Button>
            <Button href="/contact" size="lg" variant="outline" className="border-white/25 bg-white/5 text-white hover:border-white/50 hover:text-white">
              Book a Tour
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
