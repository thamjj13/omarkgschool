import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { VideoCard } from "@/components/video-card";
import { listVideos } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Video Gallery", description: "Watch life at Maplebrook International Academy." };
}

export default function VideosPage() {
  const videos = listVideos();

  return (
    <>
      <PageHeader title="Video Gallery" subtitle="Campus tours, performances and highlights from the year." crumb="videos" />
      <section className="mx-auto max-w-7xl px-6 py-16">
        {videos.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <VideoCard key={v.id} item={v} />
            ))}
          </div>
        ) : (
          <p className="text-center text-ink-500">Videos will appear here soon.</p>
        )}
      </section>
    </>
  );
}
