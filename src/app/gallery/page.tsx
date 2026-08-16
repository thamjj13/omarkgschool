import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { MediaImg } from "@/components/media-img";
import { Icon } from "@/components/ui/icon";
import { listGalleryAlbums } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Photo Gallery", description: "A glimpse of life at Maplebrook International Academy." };
}

export default function GalleryPage() {
  const albums = listGalleryAlbums();

  return (
    <>
      <PageHeader title="Photo Gallery" subtitle="Everyday moments of learning, play and celebration." crumb="gallery" />
      <section className="mx-auto max-w-7xl px-6 py-16">
        {albums.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((a) => (
              <Link
                key={a.id}
                href={`/gallery/${a.slug}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl"
              >
                {a.cover_id ? (
                  <MediaImg id={a.cover_id} alt={a.title} thumb className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-100 to-accent-100">
                    <Icon name="image" size={48} className="text-brand-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <h2 className="font-display text-xl font-semibold">{a.title}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-200">
                    <Icon name="image" size={14} /> {a.media_count} photo{a.media_count === 1 ? "" : "s"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-ink-500">No albums yet.</p>
        )}
      </section>
    </>
  );
}
