import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { NewsCard } from "@/components/cards";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { listNewsPublic, newsCategories } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "News & Announcements", description: "The latest news from Maplebrook International Academy." };
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const category = sp.category ?? "all";
  const categories = newsCategories();
  const { items, totalPages } = listNewsPublic({ page, pageSize: 9, category });

  return (
    <>
      <PageHeader title="News & Announcements" subtitle="Stories, achievements and updates from around campus." crumb="news" />

      <section className="mx-auto max-w-7xl px-6 py-12">
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/news"
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                category === "all" ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-700 hover:bg-ink-200"
              )}
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={`/news?category=${encodeURIComponent(c)}`}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  category === c ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-700 hover:bg-ink-200"
                )}
              >
                {c}
              </Link>
            ))}
          </div>
        )}

        {items.length > 0 ? (
          <>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((n) => (
                <NewsCard key={n.id} item={n} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} basePath="/news" query={{ category: category === "all" ? "" : category }} />
          </>
        ) : (
          <div className="mt-10">
            <EmptyState icon="newspaper" title="No news yet" description="Check back soon for the latest stories." />
          </div>
        )}
      </section>
    </>
  );
}
