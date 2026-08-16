"use client";

import { useCallback, useEffect, useState } from "react";
import { mediaUrl } from "@/lib/media-url";
import { Icon } from "./ui/icon";

export function GalleryLightbox({ media }: { media: any[] }) {
  const [index, setIndex] = useState<number | null>(null);

  const close = useCallback(() => setIndex(null), []);
  const next = useCallback(() => setIndex((i) => (i === null ? null : (i + 1) % media.length)), [media.length]);
  const prev = useCallback(() => setIndex((i) => (i === null ? null : (i - 1 + media.length) % media.length)), [media.length]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, close, next, prev]);

  if (!media.length) {
    return <p className="text-ink-500">No photos in this album yet.</p>;
  }

  const current = index !== null ? media[index] : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {media.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setIndex(i)}
            className="group relative aspect-square overflow-hidden rounded-xl bg-ink-100 focus-visible:outline-2 focus-visible:outline-brand-500"
            aria-label={m.alt_text || m.original_name || `Photo ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${mediaUrl(m.id)}?thumb=1`}
              alt={m.alt_text || m.original_name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {current && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-ink-950/90 p-4" role="dialog" aria-modal="true">
          <button onClick={close} className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20" aria-label="Close">
            <Icon name="x" size={22} />
          </button>
          <button onClick={prev} className="absolute left-2 z-10 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 sm:left-6" aria-label="Previous photo">
            <Icon name="chevron-left" size={24} />
          </button>
          <figure className="max-h-[85vh] max-w-5xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaUrl(current.id)} alt={current.alt_text || current.original_name} className="max-h-[78vh] w-auto rounded-xl object-contain" />
            {(current.caption || current.alt_text) && (
              <figcaption className="mt-3 text-center text-sm text-white">
                {current.caption || current.alt_text}
              </figcaption>
            )}
          </figure>
          <button onClick={next} className="absolute right-2 z-10 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 sm:right-6" aria-label="Next photo">
            <Icon name="chevron-right" size={24} />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70">
            {index! + 1} / {media.length}
          </div>
        </div>
      )}
    </>
  );
}
