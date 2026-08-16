import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "./globals.css";
import { siteSettings, listPrograms } from "@/lib/services/site";
import { listNavigation } from "@/lib/services/settings";
import { buildNavTree } from "@/lib/utils/nav";
import { config } from "@/lib/config";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Toaster } from "@/components/ui/toast";

export const dynamic = "force-dynamic";

const s = siteSettings();

export const viewport: Viewport = {
  themeColor: "#0f3f2d",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: {
    default: s.metaTitle,
    template: `%s · ${s.schoolName}`,
  },
  description: s.metaDescription,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: s.schoolName,
    title: s.metaTitle,
    description: s.metaDescription,
    url: config.siteUrl,
    images: [{ url: "/images/seed/hero-campus.jpg", width: 1200, height: 630, alt: s.schoolName }],
  },
  twitter: {
    card: "summary_large_image",
    title: s.metaTitle,
    description: s.metaDescription,
    images: ["/images/seed/hero-campus.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const headerNav = buildNavTree(listNavigation("header"));
  const footerNav = buildNavTree(listNavigation("footer"));
  const programs = listPrograms().map((p) => ({ name: p.name as string, slug: p.slug as string }));

  return (
    <html lang="en">
      <body className="min-h-screen">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-soft"
        >
          Skip to content
        </a>
        <SiteHeader
          name={s.schoolName}
          tagline={s.tagline}
          phone={s.phone}
          email={s.email}
          nav={headerNav}
          socials={{ facebook: s.facebook, twitter: s.twitter, instagram: s.instagram, youtube: s.youtube, linkedin: s.linkedin }}
        />
        <main id="main">{children}</main>
        <SiteFooter
          name={s.schoolName}
          tagline={s.tagline}
          description={s.description}
          address={s.address}
          phone={s.phone}
          email={s.email}
          workingHours={s.workingHours}
          footerNav={footerNav}
          programs={programs}
          socials={{ facebook: s.facebook, twitter: s.twitter, instagram: s.instagram, youtube: s.youtube, linkedin: s.linkedin }}
        />
        <Toaster />
      </body>
    </html>
  );
}
