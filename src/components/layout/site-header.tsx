"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "../logo";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { SearchDialog } from "./search-dialog";
import type { NavNode } from "@/lib/utils/nav";

export function SiteHeader({
  name,
  tagline,
  phone,
  email,
  nav,
  socials,
}: {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  nav: NavNode[];
  socials: { facebook: string; twitter: string; instagram: string; youtube: string; linkedin: string };
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  const isActive = (url: string) =>
    url !== "/" && (pathname === url || pathname.startsWith(url + "/"));

  return (
    <header className="sticky top-0 z-50">
      {/* top bar */}
      <div className="hidden bg-ink-950 text-ink-200 lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-xs">
          <div className="flex items-center gap-6">
            <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="flex items-center gap-1.5 hover:text-white">
              <Icon name="phone" size={14} /> {phone}
            </a>
            <a href={`mailto:${email}`} className="flex items-center gap-1.5 hover:text-white">
              <Icon name="mail" size={14} /> {email}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-ink-400">Follow us</span>
            {[
              ["facebook", socials.facebook],
              ["twitter", socials.twitter],
              ["instagram", socials.instagram],
              ["youtube", socials.youtube],
              ["linkedin", socials.linkedin],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-ink-300 transition-colors hover:text-accent-300"
              >
                <Icon name={label as keyof typeof socials} size={15} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* main bar */}
      <div
        className={cn(
          "border-b border-ink-100 bg-white/95 backdrop-blur transition-shadow",
          scrolled && "shadow-soft"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="Home">
            <Logo name={name} tagline={tagline} />
          </Link>

          <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary">
            {nav.map((item, i) => (
              <div
                key={i}
                className="relative"
                onMouseEnter={() => setOpenDropdown(i)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {item.children.length > 0 ? (
                  <>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === i ? null : i)}
                      aria-expanded={openDropdown === i}
                      className={cn(
                        "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive(item.url) ? "text-brand-700" : "text-ink-700 hover:text-brand-700"
                      )}
                    >
                      {item.label}
                      <Icon name="chevron-down" size={14} className={cn("transition-transform", openDropdown === i && "rotate-180")} />
                    </button>
                    {openDropdown === i && (
                      <div className="absolute left-0 top-full w-60 rounded-2xl border border-ink-100 bg-white p-1.5 shadow-card animate-fade-up">
                        {item.children.map((child, j) => (
                          <Link
                            key={j}
                            href={child.url}
                            className="block rounded-xl px-3 py-2.5 text-sm text-ink-700 hover:bg-brand-50 hover:text-brand-700"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.url}
                    target={item.target === "_blank" ? "_blank" : undefined}
                    className={cn(
                      "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive(item.url) ? "text-brand-700" : "text-ink-700 hover:text-brand-700"
                    )}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="rounded-xl border border-ink-200 p-2.5 text-ink-600 transition-colors hover:border-brand-400 hover:text-brand-700"
            >
              <Icon name="search" size={18} />
            </button>
            <Button href="/admissions/apply" size="sm" className="hidden sm:inline-flex">
              Apply Now
            </Button>
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="rounded-xl border border-ink-200 p-2.5 text-ink-700 xl:hidden"
            >
              <Icon name="menu" size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[90] xl:hidden">
          <div className="absolute inset-0 bg-ink-950/50 animate-fade-in" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-[320px] max-w-[85vw] flex-col overflow-y-auto bg-white shadow-2xl animate-fade-up">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <Logo name={name} />
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="rounded-lg p-2 text-ink-500 hover:bg-ink-100">
                <Icon name="x" size={20} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4" aria-label="Mobile">
              {nav.map((item, i) => (
                <div key={i} className="mb-1">
                  {item.children.length > 0 ? (
                    <>
                      <p className="px-3 py-2 text-sm font-semibold text-ink-900">{item.label}</p>
                      {item.children.map((child, j) => (
                        <Link
                          key={j}
                          href={child.url}
                          className="block rounded-lg px-5 py-2 text-sm text-ink-600 hover:bg-brand-50"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </>
                  ) : (
                    <Link
                      href={item.url}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-ink-800 hover:bg-brand-50"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
            <div className="border-t border-ink-100 p-4">
              <Button href="/admissions/apply" className="w-full">
                Apply Now
              </Button>
            </div>
          </div>
        </div>
      )}

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
