import Link from "next/link";
import { Icon } from "./ui/icon";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  basePath,
  query = {},
}: {
  page: number;
  totalPages: number;
  basePath: string;
  query?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v) params.set(k, v);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <Link
        href={href(page - 1)}
        aria-disabled={page <= 1}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 text-ink-600 hover:border-brand-400 hover:text-brand-700",
          page <= 1 && "pointer-events-none opacity-40"
        )}
      >
        <Icon name="chevron-left" size={16} />
      </Link>
      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition-colors",
            p === page
              ? "bg-brand-600 text-white"
              : "border border-ink-200 text-ink-600 hover:border-brand-400 hover:text-brand-700"
          )}
        >
          {p}
        </Link>
      ))}
      <Link
        href={href(page + 1)}
        aria-disabled={page >= totalPages}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 text-ink-600 hover:border-brand-400 hover:text-brand-700",
          page >= totalPages && "pointer-events-none opacity-40"
        )}
      >
        <Icon name="chevron-right" size={16} />
      </Link>
    </nav>
  );
}
