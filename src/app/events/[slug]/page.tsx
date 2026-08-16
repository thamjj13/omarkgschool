import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MediaImg } from "@/components/media-img";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { formatDate } from "@/lib/utils";
import { getEventBySlug } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = getEventBySlug(slug);
  return { title: e ? e.title : "Event", description: e ? (e.description as string).slice(0, 160) : undefined };
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event) notFound();

  const details = [
    { icon: "calendar" as const, label: "Date", value: formatDate(event.start_date, { weekday: "long", year: "numeric", month: "long", day: "numeric" }) },
    { icon: "clock" as const, label: "Time", value: [event.start_time, event.end_time].filter(Boolean).join(" – ") || "All day" },
    { icon: "map-pin" as const, label: "Location", value: event.location || "Campus" },
  ].filter((d) => d.value);

  return (
    <>
      <section className="relative overflow-hidden bg-ink-950 py-20 text-white">
        {event.image_id && <MediaImg id={event.image_id} alt={event.title} eager className="absolute inset-0 h-full w-full opacity-25" />}
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/80 to-ink-950/40" />
        <div className="relative mx-auto max-w-6xl px-6">
          <nav className="mb-4 flex items-center gap-1.5 text-xs font-medium text-ink-300">
            <Link href="/" className="hover:text-white">Home</Link>
            <Icon name="chevron-right" size={13} />
            <Link href="/events" className="hover:text-white">Events</Link>
          </nav>
          {event.event_type && <Badge tone="accent">{event.event_type}</Badge>}
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">{event.title}</h1>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="prose-html max-w-none">
            {event.description ? (
              <div dangerouslySetInnerHTML={{ __html: event.description }} />
            ) : (
              <p>More details about this event will be shared soon.</p>
            )}
          </div>
          <aside className="space-y-4">
            <div className="rounded-2xl border border-ink-100 bg-ink-50 p-6">
              <h2 className="font-display text-base font-semibold text-ink-950">Event details</h2>
              <dl className="mt-4 space-y-4">
                {details.map((d) => (
                  <div key={d.label} className="flex gap-3">
                    <Icon name={d.icon} size={18} className="mt-0.5 shrink-0 text-brand-600" />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{d.label}</dt>
                      <dd className="mt-0.5 text-sm font-medium text-ink-900">{d.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
              <div className="mt-6">
                <Button href="/contact" variant="outline" className="w-full">Enquire about this event</Button>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
