"use client";

import { useEffect, useState } from "react";
import { Icon } from "../ui/icon";
import { Avatar, Stars } from "../cards";
import { cn } from "@/lib/utils";

export function TestimonialsCarousel({ items }: { items: any[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length]);

  if (!items.length) return null;
  const item = items[index % items.length];

  return (
    <div className="relative mx-auto max-w-3xl">
      <div className="relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-8 text-center shadow-card sm:p-12">
        <Icon name="quote" size={40} className="mx-auto text-accent-300" />
        <blockquote className="mt-4 font-display text-xl font-medium leading-relaxed text-ink-800 sm:text-2xl">
          “{item.quote}”
        </blockquote>
        <div className="mt-6 flex flex-col items-center gap-3">
          <Avatar name={item.name} mediaId={item.photo_id} className="h-14 w-14 text-lg" />
          <div>
            <p className="font-semibold text-ink-950">{item.name}</p>
            <p className="text-sm text-ink-500">{item.role_title}</p>
          </div>
          <Stars rating={item.rating} />
        </div>
      </div>

      {items.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => setIndex((index - 1 + items.length) % items.length)}
            aria-label="Previous testimonial"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 text-ink-600 hover:border-brand-400 hover:text-brand-700"
          >
            <Icon name="chevron-left" size={18} />
          </button>
          <div className="flex gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                className={cn("h-2 rounded-full transition-all", i === index ? "w-6 bg-brand-600" : "w-2 bg-ink-200")}
              />
            ))}
          </div>
          <button
            onClick={() => setIndex((index + 1) % items.length)}
            aria-label="Next testimonial"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 text-ink-600 hover:border-brand-400 hover:text-brand-700"
          >
            <Icon name="chevron-right" size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
