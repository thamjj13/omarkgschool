import Link from "next/link";
import { Icon } from "./ui/icon";

export function PageHeader({
  title,
  subtitle,
  crumb,
}: {
  title: string;
  subtitle?: string;
  crumb?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-ink-100 bg-gradient-to-br from-brand-50 via-white to-accent-50">
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="relative mx-auto max-w-7xl px-6 py-14 sm:py-16">
        <nav className="mb-3 flex items-center gap-1.5 text-xs font-medium text-ink-400" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-brand-700">Home</Link>
          <Icon name="chevron-right" size={13} />
          {crumb && (
            <>
              <Link href={`/${crumb}`} className="capitalize hover:text-brand-700">{crumb}</Link>
              <Icon name="chevron-right" size={13} />
            </>
          )}
          <span className="text-brand-700">{title}</span>
        </nav>
        <h1 className="font-display text-4xl font-semibold text-ink-950 sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-base text-ink-500 sm:text-lg">{subtitle}</p>}
      </div>
    </section>
  );
}
