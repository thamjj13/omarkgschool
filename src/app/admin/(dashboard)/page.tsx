import type { Metadata } from "next";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { Badge } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/utils";
import { dashboardStats, recentActivity, admissionsByStatus, messagesByStatus } from "@/lib/services/dashboard";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Dashboard" };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  reviewing: "bg-sky-100 text-sky-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  unread: "bg-rose-100 text-rose-700",
  read: "bg-slate-200 text-slate-600",
  responded: "bg-emerald-100 text-emerald-800",
};

function StatCard({ icon, label, value, href }: { icon: IconName; label: string; value: number; href?: string }) {
  const inner = (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon name={icon} size={20} />
        </div>
        {href && <Icon name="arrow-up-right" size={16} className="text-ink-300" />}
      </div>
      <p className="mt-4 font-display text-3xl font-semibold text-ink-950">{value.toLocaleString()}</p>
      <p className="mt-0.5 text-sm text-ink-500">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function Bar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="capitalize text-ink-600">{label}</span>
        <span className="font-medium text-ink-900">{count}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const stats = dashboardStats();
  const activity = recentActivity(8);
  const admissions = admissionsByStatus();
  const messages = messagesByStatus();

  const admissionTotal = Object.values(admissions).reduce((a, b) => a + b, 0);
  const messageTotal = Object.values(messages).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* primary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="newspaper" label="Published news" value={stats.news} href="/admin/resources/news" />
        <StatCard icon="calendar" label="Events" value={stats.events} href="/admin/resources/events" />
        <StatCard icon="users" label="Teachers & staff" value={stats.staff} href="/admin/resources/teachers" />
        <StatCard icon="graduation" label="Programs" value={stats.programs} href="/admin/resources/programs" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="file-text" label="Applications" value={stats.admissions_total} href="/admin/admissions" />
        <StatCard icon="mail" label="Unread messages" value={stats.messages_unread} href="/admin/messages" />
        <StatCard icon="image" label="Media files" value={stats.media} href="/admin/media" />
        <StatCard icon="send" label="Subscribers" value={stats.subscribers} href="/admin/subscribers" />
      </div>

      {/* alerts */}
      {(stats.admissions_pending > 0 || stats.messages_unread > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.admissions_pending > 0 && (
            <Link href="/admin/admissions?status=pending" className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <Icon name="alert" size={20} className="text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">{stats.admissions_pending} application{stats.admissions_pending === 1 ? "" : "s"} awaiting review</p>
                <p className="text-xs text-amber-700">Click to review</p>
              </div>
              <Icon name="chevron-right" size={16} className="text-amber-600" />
            </Link>
          )}
          {stats.messages_unread > 0 && (
            <Link href="/admin/messages?status=unread" className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <Icon name="mail" size={20} className="text-rose-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-rose-900">{stats.messages_unread} unread message{stats.messages_unread === 1 ? "" : "s"}</p>
                <p className="text-xs text-rose-700">Click to read</p>
              </div>
              <Icon name="chevron-right" size={16} className="text-rose-600" />
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* activity */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-ink-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <h2 className="font-display text-base font-semibold text-ink-950">Recent activity</h2>
              <Link href="/admin/activity" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>
            </div>
            {activity.length > 0 ? (
              <ul className="divide-y divide-ink-100">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
                      <Icon name="activity" size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink-800">
                        <strong>{a.user_name ?? "System"}</strong>{" "}
                        <span className="text-brand-700">{a.action}</span>
                        {a.entity_type && <span className="text-ink-400"> · {a.entity_type}</span>}
                      </p>
                      <p className="text-xs text-ink-400">{formatDateTime(a.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-ink-400">No activity yet.</p>
            )}
          </div>
        </div>

        {/* breakdowns */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
            <h2 className="font-display text-base font-semibold text-ink-950">Applications</h2>
            <div className="mt-4 space-y-3">
              {Object.entries(admissions).length > 0 ? (
                Object.entries(admissions).map(([k, v]) => <Bar key={k} label={k} count={v} total={admissionTotal} />)
              ) : (
                <p className="text-sm text-ink-400">No applications yet.</p>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.keys(admissions).map((k) => (
                <Badge key={k} className={STATUS_COLORS[k] ?? ""}>{k}</Badge>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
            <h2 className="font-display text-base font-semibold text-ink-950">Messages</h2>
            <div className="mt-4 space-y-3">
              {Object.entries(messages).length > 0 ? (
                Object.entries(messages).map(([k, v]) => <Bar key={k} label={k} count={v} total={messageTotal} />)
              ) : (
                <p className="text-sm text-ink-400">No messages yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
