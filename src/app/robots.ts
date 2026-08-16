import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/admin", "/api/auth", "/api/media"],
      },
    ],
    sitemap: `${config.siteUrl}/sitemap.xml`,
  };
}
