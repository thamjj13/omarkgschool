"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./ui/icon";

export function FaqAccordion({ items }: { items: any[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((f, i) => (
        <div key={f.id} className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span className="font-medium text-ink-900">{f.question}</span>
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-600 transition-transform",
                open === i && "rotate-180 bg-brand-600 text-white"
              )}
            >
              <Icon name="chevron-down" size={16} />
            </span>
          </button>
          <div className={cn("grid transition-all duration-300", open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
            <div className="overflow-hidden">
              <p className="px-5 pb-4 text-sm leading-relaxed text-ink-600">{f.answer}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
