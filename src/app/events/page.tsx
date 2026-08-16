import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EventCard } from "@/components/cards";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { listEventsPublic } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Events Calendar", description: "Upcoming and past events at Maplebrook International Academy." };
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; scope?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const scope = (sp.scope ?? "upcoming") as "upcoming" | "past" | "all";
  const { items, totalPages } = listEventsPublic({ scope, page, pageSize: 9 });

  const tabs = [
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
    { key: "all", label: "All events" },
  ];

  return (
    <>
      <PageHeader title="Events Calendar" subtitle="Performances, competitions, open days and everything in between." crumb="events" />

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/events?scope=${t.key}`}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                scope === t.key ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-700 hover:bg-ink-200"
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {items.length > 0 ? (
          <>
            <div className="mt-8 grid gap-4">
              {items.map((e) => (
                <EventCard key={e.id} item={e} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} basePath="/events" query={{ scope: scope === "upcoming" ? "" : scope }} />
          </>
        ) : (
          <div className="mt-8">
            <EmptyState icon="calendar" title="No events found" description="There are no events in this view yet." />
          </div>
        )}
      </section>
    </>
  );
}
