import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: ReactNode;
  tone?: "brand" | "accent" | "slate" | "rose" | "amber" | "sky" | "violet" | "emerald";
  className?: string;
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-100 text-brand-800",
    accent: "bg-accent-100 text-accent-800",
    slate: "bg-ink-100 text-ink-700",
    rose: "bg-rose-100 text-rose-700",
    amber: "bg-amber-100 text-amber-800",
    sky: "bg-sky-100 text-sky-800",
    violet: "bg-violet-100 text-violet-800",
    emerald: "bg-emerald-100 text-emerald-800",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent",
        className
      )}
      aria-label="Loading"
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function EmptyState({
  icon = "info",
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
        <Icon name={icon} size={26} />
      </div>
      <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  light = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  light?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" ? "mx-auto text-center" : "text-left")}>
      {eyebrow && (
        <p className={cn("mb-2 text-xs font-semibold uppercase tracking-[0.2em]", light ? "text-accent-300" : "text-brand-600")}>
          {eyebrow}
        </p>
      )}
      <h2 className={cn("font-display text-3xl font-semibold leading-tight sm:text-4xl", light ? "text-white" : "text-ink-950")}>
        {title}
      </h2>
      {subtitle && (
        <p className={cn("mt-3 text-base", light ? "text-ink-100" : "text-ink-500")}>{subtitle}</p>
      )}
    </div>
  );
}
