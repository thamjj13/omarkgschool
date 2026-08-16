import type { MetadataRoute } from "next";
import { config } from "@/lib/config";
import { sitemapEntries } from "@/lib/services/site";

export const dynamic = "force-dynamic";

const STATIC_ROUTES = [
  "/",
  "/about",
  "/about/mission",
  "/about/principal",
  "/about/teachers",
  "/academics",
  "/academics/programs",
  "/academics/departments",
  "/achievements",
  "/news",
  "/events",
  "/notices",
  "/gallery",
  "/videos",
  "/admissions",
  "/admissions/apply",
  "/faq",
  "/alumni",
  "/testimonials",
  "/downloads",
  "/contact",
  "/search",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = config.siteUrl;
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((url) => ({
    url: `${base}${url}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: url === "/" ? 1 : 0.7,
  }));

  for (const e of sitemapEntries()) {
    entries.push({
      url: `${base}${e.url}`,
      lastModified: e.lastModified ? new Date(e.lastModified) : new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  return entries;
}
