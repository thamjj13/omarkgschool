import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MediaImg } from "@/components/media-img";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/primitives";
import { NewsCard } from "@/components/cards";
import { formatDate, excerpt } from "@/lib/utils";
import { getNewsBySlug } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const n = getNewsBySlug(slug);
  return {
    title: n ? n.title : "News",
    description: n ? excerpt(n.excerpt ?? n.content, 160) : undefined,
    openGraph: n
      ? {
          type: "article",
          title: n.title,
          description: excerpt(n.excerpt ?? n.content, 160),
          publishedTime: n.published_at,
        }
      : undefined,
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getNewsBySlug(slug);
  if (!article) notFound();

  return (
    <article>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <nav className="flex items-center gap-1.5 text-xs font-medium text-ink-400">
          <Link href="/" className="hover:text-brand-700">Home</Link>
          <Icon name="chevron-right" size={13} />
          <Link href="/news" className="hover:text-brand-700">News</Link>
        </nav>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {article.category && <Badge tone="brand">{article.category}</Badge>}
          <time className="text-sm text-ink-400">{formatDate(article.published_at ?? article.created_at)}</time>
          {article.author_name && <span className="text-sm text-ink-400">by {article.author_name}</span>}
        </div>

        <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-ink-950 sm:text-5xl">{article.title}</h1>

        {article.image_id && (
          <div className="mt-8 overflow-hidden rounded-3xl shadow-soft">
            <MediaImg id={article.image_id} alt={article.title} className="aspect-[16/9] w-full" eager />
          </div>
        )}

        <div className="prose-html mt-8 max-w-none text-[17px]" dangerouslySetInnerHTML={{ __html: article.content }} />

        <div className="mt-10 flex items-center justify-between border-t border-ink-100 pt-6">
          <Link href="/news" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
            <Icon name="arrow-left" size={16} /> All news
          </Link>
        </div>
      </section>

      {article.related?.length > 0 && (
        <section className="bg-ink-50 py-16">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="font-display text-2xl font-semibold text-ink-950">Related stories</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {article.related.map((n: any) => (
                <NewsCard key={n.id} item={n} />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
