import { getDb } from "../db/client";
import { listActivity } from "./activity";

export interface DashboardStats {
  news: number;
  events: number;
  programs: number;
  staff: number;
  media: number;
  documents: number;
  testimonials: number;
  admissions_total: number;
  admissions_pending: number;
  messages_unread: number;
  subscribers: number;
  users: number;
}

export function dashboardStats(): DashboardStats {
  const db = getDb();
  const count = (sql: string, ...params: unknown[]) =>
    (db.prepare(sql).get(...params) as { n: number }).n;

  return {
    news: count(`SELECT COUNT(*) AS n FROM news WHERE status = 'published'`),
    events: count(`SELECT COUNT(*) AS n FROM events WHERE status = 'published'`),
    programs: count(`SELECT COUNT(*) AS n FROM programs WHERE status = 'active'`),
    staff: count(`SELECT COUNT(*) AS n FROM staff WHERE status = 'active'`),
    media: count(`SELECT COUNT(*) AS n FROM media`),
    documents: count(`SELECT COUNT(*) AS n FROM documents`),
    testimonials: count(`SELECT COUNT(*) AS n FROM testimonials WHERE status = 'published'`),
    admissions_total: count(`SELECT COUNT(*) AS n FROM admissions`),
    admissions_pending: count(`SELECT COUNT(*) AS n FROM admissions WHERE status = 'pending'`),
    messages_unread: count(`SELECT COUNT(*) AS n FROM contact_messages WHERE status = 'unread'`),
    subscribers: count(`SELECT COUNT(*) AS n FROM newsletter_subscribers WHERE status = 'subscribed'`),
    users: count(`SELECT COUNT(*) AS n FROM users WHERE status = 'active'`),
  };
}

export function recentActivity(limit = 8) {
  return listActivity({ page: 1, pageSize: limit }).items;
}

export function admissionsByStatus(): Record<string, number> {
  const rows = getDb()
    .prepare("SELECT status, COUNT(*) AS n FROM admissions GROUP BY status")
    .all() as { status: string; n: number }[];
  return Object.fromEntries(rows.map((r) => [r.status, r.n]));
}

export function messagesByStatus(): Record<string, number> {
  const rows = getDb()
    .prepare("SELECT status, COUNT(*) AS n FROM contact_messages GROUP BY status")
    .all() as { status: string; n: number }[];
  return Object.fromEntries(rows.map((r) => [r.status, r.n]));
}
