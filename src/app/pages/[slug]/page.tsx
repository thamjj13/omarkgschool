import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getPageBySlug } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getPageBySlug(slug);
  return {
    title: page?.meta_title || page?.title || "Page",
    description: page?.meta_description || page?.excerpt || undefined,
  };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getPageBySlug(slug);
  if (!page) notFound();

  return (
    <>
      <PageHeader title={page.title} subtitle={page.excerpt || undefined} />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="prose-html max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
      </section>
    </>
  );
}
