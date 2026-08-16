import { cn } from "@/lib/utils";

/** Original Maplebrook crest mark (stylised maple leaf inside a shield). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-10 w-10", className)} aria-hidden="true">
      <defs>
        <linearGradient id="mbg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1a7a51" />
          <stop offset="1" stopColor="#0f3f2d" />
        </linearGradient>
        <linearGradient id="mbgold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6a932" />
          <stop offset="1" stopColor="#db8d1d" />
        </linearGradient>
      </defs>
      <path
        d="M24 2 L44 9 V24 C44 36 36 44 24 46 C12 44 4 36 4 24 V9 Z"
        fill="url(#mbg)"
      />
      <path
        d="M24 2 L44 9 V24 C44 36 36 44 24 46 C12 44 4 36 4 24 V9 Z"
        fill="none"
        stroke="url(#mbgold)"
        strokeWidth="1.4"
      />
      {/* maple leaf */}
      <path
        d="M24 12 C24 18 24 20 24 20 C24 20 24 18 24 12 Z"
        fill="url(#mbgold)"
      />
      <path
        d="M24 13 L18 15 L15 20 L19 21 L17 25 L21 24 L24 30 L27 24 L31 25 L29 21 L33 20 L30 15 Z"
        fill="url(#mbgold)"
      />
      <path d="M24 13 L24 30" stroke="#0f3f2d" strokeWidth="1.2" />
    </svg>
  );
}

export function Logo({
  name,
  tagline,
  light = false,
}: {
  name: string;
  tagline?: string;
  light?: boolean;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="leading-tight">
        <span
          className={cn(
            "block font-display text-[17px] font-semibold tracking-tight",
            light ? "text-white" : "text-ink-950"
          )}
        >
          {name}
        </span>
        {tagline && (
          <span
            className={cn(
              "block max-w-[220px] truncate text-[11px]",
              light ? "text-ink-200" : "text-ink-500"
            )}
          >
            {tagline}
          </span>
        )}
      </span>
    </span>
  );
}
