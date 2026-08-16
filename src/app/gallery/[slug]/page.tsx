import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { GalleryLightbox } from "@/components/gallery-lightbox";
import { getGalleryAlbumBySlug } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = getGalleryAlbumBySlug(slug);
  return { title: data ? data.album.title : "Gallery", description: data ? data.album.description : undefined };
}

export default async function AlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = getGalleryAlbumBySlug(slug);
  if (!data) notFound();

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <nav className="flex items-center gap-1.5 text-xs font-medium text-ink-400">
        <Link href="/" className="hover:text-brand-700">Home</Link>
        <Icon name="chevron-right" size={13} />
        <Link href="/gallery" className="hover:text-brand-700">Gallery</Link>
        <Icon name="chevron-right" size={13} />
        <span className="text-brand-700">{data.album.title}</span>
      </nav>

      <h1 className="mt-4 font-display text-4xl font-semibold text-ink-950">{data.album.title}</h1>
      {data.album.description && <p className="mt-2 max-w-2xl text-ink-500">{data.album.description}</p>}

      <div className="mt-10">
        <GalleryLightbox media={data.media} />
      </div>
    </section>
  );
}
