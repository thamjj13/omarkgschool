"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoMark } from "../logo";
import { Icon, type IconName } from "../ui/icon";
import { initials, avatarColor } from "@/lib/utils";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  roleName: string;
  permissions: string[];
}

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  permission?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export function AdminShell({ user, children }: { user: AdminUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  const can = (p?: string) => !p || user.permissions.includes(p);

  const groups: NavGroup[] = [
    { label: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: "dashboard", permission: "dashboard.view" }] },
    {
      label: "Content",
      items: [
        { href: "/admin/resources/news", label: "News", icon: "newspaper", permission: "content.manage" },
        { href: "/admin/resources/announcements", label: "Announcements", icon: "megaphone", permission: "content.manage" },
        { href: "/admin/resources/events", label: "Events", icon: "calendar", permission: "content.manage" },
        { href: "/admin/resources/pages", label: "Pages", icon: "file-text", permission: "content.manage" },
      ],
    },
    {
      label: "Academics",
      items: [
        { href: "/admin/resources/departments", label: "Departments", icon: "layers", permission: "academics.manage" },
        { href: "/admin/resources/programs", label: "Programs", icon: "graduation", permission: "academics.manage" },
        { href: "/admin/resources/teachers", label: "Teachers & Staff", icon: "users", permission: "academics.manage" },
      ],
    },
    {
      label: "Media",
      items: [
        { href: "/admin/media", label: "Media Library", icon: "image", permission: "media.manage" },
        { href: "/admin/albums", label: "Gallery Albums", icon: "grid", permission: "gallery.manage" },
        { href: "/admin/resources/videos", label: "Videos", icon: "video", permission: "videos.manage" },
      ],
    },
    {
      label: "Community",
      items: [
        { href: "/admin/resources/testimonials", label: "Testimonials", icon: "quote", permission: "community.manage" },
        { href: "/admin/resources/achievements", label: "Achievements", icon: "trophy", permission: "community.manage" },
        { href: "/admin/resources/awards", label: "Awards", icon: "award", permission: "community.manage" },
        { href: "/admin/resources/alumni", label: "Alumni", icon: "graduation", permission: "community.manage" },
        { href: "/admin/resources/faqs", label: "FAQs", icon: "help", permission: "community.manage" },
        { href: "/admin/resources/documents", label: "Documents", icon: "download", permission: "documents.manage" },
      ],
    },
    {
      label: "Office",
      items: [
        { href: "/admin/admissions", label: "Admissions", icon: "file-text", permission: "admissions.manage" },
        { href: "/admin/messages", label: "Messages", icon: "mail", permission: "messages.manage" },
        { href: "/admin/subscribers", label: "Subscribers", icon: "send", permission: "messages.manage" },
      ],
    },
    {
      label: "Configuration",
      items: [
        { href: "/admin/settings", label: "Site Settings", icon: "settings", permission: "settings.manage" },
        { href: "/admin/homepage", label: "Homepage Sections", icon: "home", permission: "settings.manage" },
        { href: "/admin/navigation", label: "Navigation", icon: "list", permission: "settings.manage" },
        { href: "/admin/users", label: "Users & Roles", icon: "shield", permission: "users.manage" },
        { href: "/admin/activity", label: "Activity Log", icon: "activity", permission: "activity.view" },
      ],
    },
  ];

  useEffect(() => {
    setSidebarOpen(false);
    setUserMenu(false);
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-ink-50">
      {/* sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-ink-950 text-ink-300 transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2.5 border-b border-ink-900 px-5 py-4">
          <LogoMark className="h-9 w-9" />
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold text-white">Maplebrook</p>
            <p className="text-[11px] text-ink-400">Admin console</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((g) => {
            const visible = g.items.filter((i) => can(i.permission));
            if (!visible.length) return null;
            return (
              <div key={g.label} className="mb-5">
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-500">{g.label}</p>
                {visible.map((item) => {
                  const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                        active ? "bg-brand-600 text-white" : "text-ink-300 hover:bg-ink-900 hover:text-white"
                      )}
                    >
                      <Icon name={item.icon} size={17} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-ink-900 p-4">
          <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-300 hover:bg-ink-900 hover:text-white">
            <Icon name="external-link" size={17} /> View website
          </Link>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-ink-950/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* main */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink-100 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="rounded-lg border border-ink-200 p-2 text-ink-600 lg:hidden" aria-label="Open menu">
              <Icon name="menu" size={18} />
            </button>
            <h1 className="font-display text-base font-semibold text-ink-950 sm:text-lg">
              {groups.flatMap((g) => g.items).find((i) => pathname === i.href || pathname.startsWith(i.href))?.label ?? "Dashboard"}
            </h1>
          </div>

          <div className="relative">
            <button onClick={() => setUserMenu((v) => !v)} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-ink-50">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${avatarColor(user.name)}`}>
                {initials(user.name)}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium text-ink-900">{user.name}</span>
                <span className="block text-xs text-ink-400">{user.roleName}</span>
              </span>
              <Icon name="chevron-down" size={15} className="text-ink-400" />
            </button>

            {userMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-ink-100 bg-white p-1.5 shadow-card animate-fade-up">
                <div className="border-b border-ink-100 px-3 py-2">
                  <p className="text-sm font-medium text-ink-900">{user.name}</p>
                  <p className="truncate text-xs text-ink-400">{user.email}</p>
                </div>
                <Link href="/admin/settings" className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-ink-50">
                  <Icon name="user" size={16} /> My profile
                </Link>
                <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                  <Icon name="log-out" size={16} /> Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
