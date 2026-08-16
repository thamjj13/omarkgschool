import Link from "next/link";
import { MediaImg } from "./media-img";
import { Icon, type IconName } from "./ui/icon";
import { Badge } from "./ui/primitives";
import { formatDate, excerpt, initials, avatarColor } from "@/lib/utils";

/* ── news card ─────────────────────────────────────────────────────────── */

export function NewsCard({ item, eager = false }: { item: any; eager?: boolean }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
      <Link href={`/news/${item.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-ink-100">
        {item.image_id ? (
          <MediaImg id={item.image_id} alt={item.title} thumb className="h-full w-full transition-transform duration-500 group-hover:scale-105" eager={eager} />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-100 to-accent-100 text-brand-500">
            <Icon name="newspaper" size={40} />
          </div>
        )}
        {item.category && (
          <span className="absolute left-3 top-3">
            <Badge tone="brand">{item.category}</Badge>
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <time className="text-xs font-medium uppercase tracking-wide text-ink-400">
          {formatDate(item.published_at ?? item.created_at)}
        </time>
        <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-ink-950">
          <Link href={`/news/${item.slug}`} className="transition-colors group-hover:text-brand-700">
            {item.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-ink-500">{excerpt(item.excerpt ?? item.content, 140)}</p>
        <Link href={`/news/${item.slug}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
          Read more <Icon name="arrow-right" size={15} />
        </Link>
      </div>
    </article>
  );
}

/* ── event card ────────────────────────────────────────────────────────── */

export function EventCard({ item }: { item: any }) {
  const d = new Date(item.start_date);
  const month = Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const day = Number.isNaN(d.getTime()) ? "—" : d.getDate();
  return (
    <Link
      href={`/events/${item.slug}`}
      className="group flex gap-4 rounded-2xl border border-ink-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card"
    >
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <span className="text-[11px] font-bold leading-none">{month}</span>
        <span className="mt-1 font-display text-2xl font-semibold leading-none">{day}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {item.event_type && <Badge tone="accent">{item.event_type}</Badge>}
        </div>
        <h3 className="mt-1.5 truncate font-display text-base font-semibold text-ink-950 group-hover:text-brand-700">
          {item.title}
        </h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-500">
          {item.start_time && (
            <span className="inline-flex items-center gap-1"><Icon name="clock" size={13} /> {item.start_time}</span>
          )}
          {item.location && (
            <span className="inline-flex items-center gap-1"><Icon name="map-pin" size={13} /> {item.location}</span>
          )}
        </p>
      </div>
    </Link>
  );
}

/* ── program card ──────────────────────────────────────────────────────── */

const PROGRAM_ICONS: IconName[] = ["sparkles", "book-open", "flask", "graduation", "globe", "target"];

export function ProgramCard({ item, index = 0 }: { item: any; index?: number }) {
  return (
    <Link
      href={`/academics/programs/${item.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-ink-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-card"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-sm">
        <Icon name={PROGRAM_ICONS[index % PROGRAM_ICONS.length]} size={22} />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-ink-950 group-hover:text-brand-700">{item.name}</h3>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-brand-600">{item.grade_level}</p>
      <p className="mt-2 flex-1 text-sm text-ink-500">{item.short_description}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
        Learn more <Icon name="arrow-right" size={15} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

/* ── teacher card ──────────────────────────────────────────────────────── */

export function TeacherCard({ item }: { item: any }) {
  return (
    <Link
      href={`/about/teachers/${item.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-card"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-brand-50 to-ink-50">
        {item.photo_id ? (
          <MediaImg id={item.photo_id} alt={item.name} thumb className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className={`flex h-24 w-24 items-center justify-center rounded-full text-3xl font-semibold ${avatarColor(item.name)}`}>
              {initials(item.name)}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold text-ink-950 group-hover:text-brand-700">{item.name}</h3>
        <p className="text-sm font-medium text-brand-600">{item.position}</p>
        {item.department_name && <p className="mt-1 text-xs text-ink-400">{item.department_name}</p>}
      </div>
    </Link>
  );
}

/* ── testimonial ───────────────────────────────────────────────────────── */

export function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-accent-400" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={15} className={i <= rating ? "" : "text-ink-200"} strokeWidth={0} fill="currentColor" />
      ))}
    </div>
  );
}

/* ── avatar (initials) ─────────────────────────────────────────────────── */

export function Avatar({ name, mediaId, className = "h-12 w-12 text-base" }: { name: string; mediaId?: number | null; className?: string }) {
  if (mediaId) {
    return <MediaImg id={mediaId} alt={name} thumb className={`${className} rounded-full object-cover`} />;
  }
  return (
    <span className={`flex ${className} items-center justify-center rounded-full font-semibold ${avatarColor(name)}`}>
      {initials(name)}
    </span>
  );
}
