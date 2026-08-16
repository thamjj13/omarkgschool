import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Icon, type IconName } from "@/components/ui/icon";
import { Badge } from "@/components/ui/primitives";
import { formatDate } from "@/lib/utils";
import { getDb } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Notice Board", description: "Official notices and announcements from Maplebrook International Academy." };
}

const TYPE_META: Record<string, { icon: IconName; tone: "sky" | "emerald" | "amber" | "rose"; label: string }> = {
  info: { icon: "info", tone: "sky", label: "Information" },
  success: { icon: "check", tone: "emerald", label: "Good news" },
  warning: { icon: "alert", tone: "amber", label: "Important" },
  urgent: { icon: "bell", tone: "rose", label: "Urgent" },
};

export default function NoticesPage() {
  const db = getDb();
  const notices = db
    .prepare(
      `SELECT * FROM announcements WHERE status = 'published'
       AND (expires_at IS NULL OR expires_at >= datetime('now'))
       ORDER BY priority DESC, id DESC`
    )
    .all() as any[];

  return (
    <>
      <PageHeader title="Notice Board" subtitle="Official notices, reminders and announcements." crumb="notices" />
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-4">
          {notices.length > 0 ? (
            notices.map((n) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.info;
              return (
                <div key={n.id} className="flex gap-4 rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${meta.tone === "sky" ? "bg-sky-100 text-sky-700" : meta.tone === "emerald" ? "bg-emerald-100 text-emerald-700" : meta.tone === "amber" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                    <Icon name={meta.icon} size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-semibold text-ink-950">{n.title}</h2>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>
                    <p className="mt-1.5 text-sm text-ink-600">{n.content}</p>
                    <p className="mt-2 text-xs text-ink-400">Posted {formatDate(n.created_at)}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-ink-500">No active notices at the moment.</p>
          )}
        </div>
      </section>
    </>
  );
}
