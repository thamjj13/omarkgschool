import type { Metadata } from "next";
import { siteSettings, listNewsPublic, listEventsPublic, listPrograms, listTestimonials, listGalleryAlbums, listAnnouncementsActive } from "@/lib/services/site";
import { listEnabledHomepageSections, getSetting } from "@/lib/services/settings";
import { AnnouncementsTicker } from "@/components/home/announcements-ticker";
import {
  Hero,
  Welcome,
  StatsStrip,
  Mission,
  ProgramsSection,
  NewsSection,
  EventsSection,
  TestimonialsSection,
  GallerySection,
  CtaSection,
} from "@/components/home/sections";
import type { IconName } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const s = siteSettings();
  return {
    title: s.metaTitle,
    description: s.metaDescription,
  };
}

export default function HomePage() {
  const s = siteSettings();
  const sections = listEnabledHomepageSections();
  const news = listNewsPublic({ page: 1, pageSize: 3, limit: 3 }).items;
  const events = listEventsPublic({ scope: "upcoming", page: 1, pageSize: 3, limit: 3 }).items;
  const programs = listPrograms();
  const testimonials = listTestimonials();
  const albums = listGalleryAlbums();
  const announcements = listAnnouncementsActive();

  const stats: { value: string; label: string; icon: IconName }[] = [
    { value: getSetting("stats_students", "0"), label: "Students", icon: "users" },
    { value: getSetting("stats_teachers", "0"), label: "Teachers", icon: "graduation" },
    { value: getSetting("stats_graduates", "0"), label: "Graduates", icon: "target" },
    { value: getSetting("stats_awards", "0"), label: "Awards won", icon: "trophy" },
  ];

  return (
    <>
      <AnnouncementsTicker items={announcements} />
      {sections.map((section) => {
        switch (section.type) {
          case "hero":
            return <Hero key={section.key} section={section} motto={s.motto} stats={stats} />;
          case "welcome":
            return <Welcome key={section.key} section={section} />;
          case "stats":
            return <StatsStrip key={section.key} stats={stats} />;
          case "mission":
            return <Mission key={section.key} section={section} />;
          case "programs":
            return <ProgramsSection key={section.key} section={section} programs={programs} />;
          case "news":
            return <NewsSection key={section.key} section={section} news={news} />;
          case "events":
            return <EventsSection key={section.key} section={section} events={events} />;
          case "testimonials":
            return <TestimonialsSection key={section.key} section={section} testimonials={testimonials} />;
          case "gallery":
            return <GallerySection key={section.key} section={section} albums={albums} />;
          case "cta":
            return <CtaSection key={section.key} section={section} />;
          default:
            return null;
        }
      })}
    </>
  );
}
