"use client";

import { useState } from "react";
import { Icon } from "./ui/icon";
import { youtubeId } from "@/lib/utils";

export function VideoCard({ item }: { item: any }) {
  const [playing, setPlaying] = useState(false);
  const id = youtubeId(item.video_url);
  const thumb = item.thumbnail_url || (id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "");

  return (
    <div className="group overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-card">
      <div className="relative aspect-video bg-ink-950">
        {playing && item.embed_url ? (
          <iframe
            src={`${item.embed_url}${item.embed_url.includes("?") ? "&" : "?"}autoplay=1`}
            title={item.title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button onClick={() => setPlaying(true)} className="absolute inset-0 h-full w-full" aria-label={`Play ${item.title}`}>
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-800 to-ink-950 text-white">
                <Icon name="video" size={40} />
              </div>
            )}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-brand-700 shadow-lg transition-transform group-hover:scale-110">
                <Icon name="play" size={26} />
              </span>
            </span>
          </button>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display text-base font-semibold text-ink-950">{item.title}</h3>
        {item.description && <p className="mt-1 line-clamp-2 text-sm text-ink-500">{item.description}</p>}
      </div>
    </div>
  );
}
