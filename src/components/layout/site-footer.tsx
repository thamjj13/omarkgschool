"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "../logo";
import { Icon } from "../ui/icon";
import { toast } from "../ui/toast";
import type { NavNode } from "@/lib/utils/nav";

export function SiteFooter({
  name,
  tagline,
  description,
  address,
  phone,
  email,
  workingHours,
  footerNav,
  programs,
  socials,
}: {
  name: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  workingHours: string;
  footerNav: NavNode[];
  programs: { name: string; slug: string }[];
  socials: { facebook: string; twitter: string; instagram: string; youtube: string; linkedin: string };
}) {
  const [emailValue, setEmailValue] = useState("");
  const [busy, setBusy] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/public/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      });
      const json = await res.json();
      if (res.ok) {
        toast(json.data?.message ?? "Thanks for subscribing!");
        setEmailValue("");
      } else {
        toast(json.error?.fields?.email?.[0] ?? json.error?.message ?? "Please enter a valid email.", "error");
      }
    } catch {
      toast("Something went wrong. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <footer className="bg-ink-950 text-ink-300">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo name={name} tagline={tagline} light />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-400">{description}</p>
            <div className="mt-6 flex gap-3">
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
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900 text-ink-300 transition-colors hover:bg-brand-600 hover:text-white"
                >
                  <Icon name={label as keyof typeof socials} size={16} />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-white">Explore</h3>
            <ul className="space-y-2.5 text-sm">
              {footerNav.map((item, i) => (
                <li key={i}>
                  <Link href={item.url} className="text-ink-400 transition-colors hover:text-accent-300">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-white">Academics</h3>
            <ul className="space-y-2.5 text-sm">
              {programs.slice(0, 6).map((p) => (
                <li key={p.slug}>
                  <Link href={`/academics/programs/${p.slug}`} className="text-ink-400 transition-colors hover:text-accent-300">
                    {p.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/academics/departments" className="text-ink-400 transition-colors hover:text-accent-300">
                  Departments
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-white">Stay in touch</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Icon name="map-pin" size={16} className="mt-0.5 shrink-0 text-accent-300" />
                <span className="text-ink-400">{address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Icon name="phone" size={16} className="shrink-0 text-accent-300" />
                <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="text-ink-400 hover:text-accent-300">{phone}</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Icon name="mail" size={16} className="shrink-0 text-accent-300" />
                <a href={`mailto:${email}`} className="text-ink-400 hover:text-accent-300">{email}</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Icon name="clock" size={16} className="shrink-0 text-accent-300" />
                <span className="text-ink-400">{workingHours}</span>
              </li>
            </ul>

            <form onSubmit={subscribe} className="mt-5">
              <label htmlFor="footer-newsletter" className="mb-1.5 block text-xs font-medium text-ink-400">
                Newsletter
              </label>
              <div className="flex gap-2">
                <input
                  id="footer-newsletter"
                  type="email"
                  required
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full rounded-xl border border-ink-800 bg-ink-900 px-3.5 py-2.5 text-sm text-white placeholder:text-ink-500 focus:border-brand-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="shrink-0 rounded-xl bg-accent-400 px-4 text-ink-950 transition-colors hover:bg-accent-300 disabled:opacity-50"
                  aria-label="Subscribe"
                >
                  <Icon name="send" size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="border-t border-ink-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-ink-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="hover:text-ink-300">
              Staff login
            </Link>
            <Link href="/downloads" className="hover:text-ink-300">
              Downloads
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
