"use client";

import { Icon } from "../ui/icon";

export function AnnouncementsTicker({ items }: { items: any[] }) {
  if (!items.length) return null;
  const doubled = [...items, ...items];
  return (
    <div className="relative overflow-hidden bg-accent-400 text-ink-950">
      <div className="flex items-center">
        <span className="z-10 flex shrink-0 items-center gap-1.5 bg-ink-950 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white">
          <Icon name="megaphone" size={14} /> Notices
        </span>
        <div className="relative flex-1 overflow-hidden">
          <div className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap px-4 py-2 text-sm font-medium hover:[animation-play-state:paused]">
            {doubled.map((a, i) => (
              <span key={i} className="inline-flex items-center gap-2">
                <span className="font-semibold">{a.title}</span>
                <span className="text-ink-900/70">· {a.content}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
