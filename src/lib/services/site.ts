import { getDb } from "../db/client";
import { getAllSettings } from "./settings";
import { clampInt, excerpt } from "../utils";
import type { MediaRow } from "./media";

/* ── typed public settings ──────────────────────────────────────────────── */

export interface PublicSettings {
  schoolName: string;
  tagline: string;
  motto: string;
  description: string;
  foundedYear: string;
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  mapEmbedUrl: string;
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  metaTitle: string;
  metaDescription: string;
  admissionEmail: string;
}

export function siteSettings(): PublicSettings {
  const s = getAllSettings();
  return {
    schoolName: s.school_name || "Maplebrook International Academy",
    tagline: s.tagline || "Nurturing curious minds, building bright futures.",
    motto: s.motto || "Learn. Grow. Lead.",
    description:
      s.description ||
      "Maplebrook International Academy is a forward-thinking school offering a holistic, globally-minded education from early years through secondary.",
    foundedYear: s.founded_year || "1998",
    phone: s.phone || "+1 (555) 010-2030",
    email: s.email || "hello@maplebrook.edu",
    address: s.address || "42 Cedar Lane, Riverside District, Portland, OR 97204",
    workingHours: s.working_hours || "Mon – Fri · 7:30 AM – 4:00 PM",
    mapEmbedUrl:
      s.map_embed_url ||
      "https://www.google.com/maps?q=Portland%20Oregon&output=embed",
    facebook: s.facebook || "https://facebook.com",
    twitter: s.twitter || "https://x.com",
    instagram: s.instagram || "https://instagram.com",
    youtube: s.youtube || "https://youtube.com",
    linkedin: s.linkedin || "https://linkedin.com",
    metaTitle: s.meta_title || "Maplebrook International Academy",
    metaDescription:
      s.meta_description ||
      "A modern international academy offering outstanding academics, arts, athletics and character education.",
    admissionEmail: s.admission_email || "admissions@maplebrook.edu",
  };
}

/* ── news ───────────────────────────────────────────────────────────────── */

export function listNewsPublic(query: {
  page?: number;
  pageSize?: number;
  category?: string;
  featuredOnly?: boolean;
  limit?: number;
}) {
  const db = getDb();
  const page = clampInt(query.page, 1, 100000, 1);
  const pageSize = clampInt(query.pageSize, 1, 100, query.limit ?? 9);

  const clauses = [
    "status = 'published'",
    "(scheduled_at IS NULL OR scheduled_at <= datetime('now'))",
  ];
  const params: unknown[] = [];
  if (query.category && query.category !== "all") {
    clauses.push("category = ?");
    params.push(query.category);
  }
  if (query.featuredOnly) {
    clauses.push("is_featured = 1");
  }
  const where = `WHERE ${clauses.join(" AND ")}`;

  const total = (db.prepare(`SELECT COUNT(*) AS n FROM news ${where}`).get(...params) as { n: number }).n;
  const items = db
    .prepare(
      `SELECT n.*, m.id AS image_id FROM news n
       LEFT JOIN media m ON m.id = n.media_id
       ${where}
       ORDER BY COALESCE(n.published_at, n.created_at) DESC, n.id DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, (page - 1) * pageSize);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function getNewsBySlug(slug: string): any {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT n.*, m.id AS image_id, u.name AS author_name FROM news n
       LEFT JOIN media m ON m.id = n.media_id
       LEFT JOIN users u ON u.id = n.author_user_id
       WHERE n.slug = ? AND n.status = 'published'`
    )
    .get(slug) as any;
  if (!row) return null;
  const related = db
    .prepare(
      `SELECT id, title, slug, excerpt, category, published_at FROM news
       WHERE status = 'published' AND category = ? AND id != ?
       ORDER BY COALESCE(published_at, created_at) DESC LIMIT 3`
    )
    .all(row.category, row.id);
  return { ...row, related };
}

export function newsCategories(): string[] {
  const rows = getDb()
    .prepare(
      `SELECT DISTINCT category FROM news WHERE status = 'published' AND category != '' ORDER BY category`
    )
    .all() as { category: string }[];
  return rows.map((r) => r.category);
}

/* ── events ─────────────────────────────────────────────────────────────── */

export function listEventsPublic(query: {
  scope?: "upcoming" | "past" | "all";
  page?: number;
  pageSize?: number;
  limit?: number;
}) {
  const db = getDb();
  const page = clampInt(query.page, 1, 100000, 1);
  const pageSize = clampInt(query.pageSize, 1, 100, query.limit ?? 9);

  const clauses = ["status = 'published'"];
  if (query.scope === "upcoming") clauses.push("(end_date >= date('now') OR end_date = '')");
  if (query.scope === "past") clauses.push("end_date < date('now')");
  const where = `WHERE ${clauses.join(" AND ")}`;

  const total = (db.prepare(`SELECT COUNT(*) AS n FROM events ${where}`).get() as { n: number }).n;
  const items = db
    .prepare(
      `SELECT e.*, m.id AS image_id FROM events e
       LEFT JOIN media m ON m.id = e.media_id
       ${where}
       ORDER BY CASE WHEN e.start_date = '' THEN 1 ELSE 0 END, e.start_date ASC, e.id ASC
       LIMIT ? OFFSET ?`
    )
    .all(pageSize, (page - 1) * pageSize);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function getEventBySlug(slug: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT e.*, m.id AS image_id FROM events e
       LEFT JOIN media m ON m.id = e.media_id
       WHERE e.slug = ? AND e.status = 'published'`
    )
    .get(slug);
}

/* ── announcements ──────────────────────────────────────────────────────── */

export function listAnnouncementsActive() {
  return getDb()
    .prepare(
      `SELECT * FROM announcements
       WHERE status = 'published'
         AND (starts_at IS NULL OR starts_at <= datetime('now'))
         AND (expires_at IS NULL OR expires_at >= datetime('now'))
       ORDER BY priority DESC, id DESC`
    )
    .all();
}

/* ── academics ──────────────────────────────────────────────────────────── */

export function listDepartments() {
  return getDb()
    .prepare(`SELECT * FROM departments WHERE status = 'active' ORDER BY display_order, id`)
    .all();
}

export function listPrograms() {
  const db = getDb();
  return db
    .prepare(
      `SELECT p.*, d.name AS department_name, m.id AS image_id
       FROM programs p
       LEFT JOIN departments d ON d.id = p.department_id
       LEFT JOIN media m ON m.id = p.media_id
       WHERE p.status = 'active'
       ORDER BY p.display_order, p.id`
    )
    .all();
}

export function getProgramBySlug(slug: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT p.*, d.name AS department_name, m.id AS image_id
       FROM programs p
       LEFT JOIN departments d ON d.id = p.department_id
       LEFT JOIN media m ON m.id = p.media_id
       WHERE p.slug = ? AND p.status = 'active'`
    )
    .get(slug);
}

export function listTeachers(query: { department?: string; featuredOnly?: boolean } = {}) {
  const db = getDb();
  const clauses = ["s.status = 'active'"];
  const params: unknown[] = [];
  if (query.department && query.department !== "all") {
    clauses.push("d.slug = ?");
    params.push(query.department);
  }
  if (query.featuredOnly) clauses.push("s.is_featured = 1");
  return db
    .prepare(
      `SELECT s.*, d.name AS department_name, d.slug AS department_slug, m.id AS photo_id
       FROM staff s
       LEFT JOIN departments d ON d.id = s.department_id
       LEFT JOIN media m ON m.id = s.media_id
       WHERE ${clauses.join(" AND ")}
       ORDER BY s.display_order, s.id`
    )
    .all(...params);
}

export function getTeacherBySlug(slug: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT s.*, d.name AS department_name, d.slug AS department_slug, m.id AS photo_id
       FROM staff s
       LEFT JOIN departments d ON d.id = s.department_id
       LEFT JOIN media m ON m.id = s.media_id
       WHERE s.slug = ? AND s.status = 'active'`
    )
    .get(slug);
}

/* ── community ──────────────────────────────────────────────────────────── */

export function listTestimonials() {
  return getDb()
    .prepare(
      `SELECT t.*, m.id AS photo_id FROM testimonials t
       LEFT JOIN media m ON m.id = t.media_id
       WHERE t.status = 'published' ORDER BY t.display_order, t.id`
    )
    .all();
}

export function listFaqs() {
  return getDb()
    .prepare(`SELECT * FROM faqs WHERE status = 'published' ORDER BY display_order, id`)
    .all();
}

export function listAchievements() {
  const db = getDb();
  return db
    .prepare(
      `SELECT a.*, m.id AS image_id FROM achievements a
       LEFT JOIN media m ON m.id = a.media_id
       WHERE a.status = 'published' ORDER BY a.achievement_date DESC, a.id DESC`
    )
    .all();
}

export function listAwards() {
  const db = getDb();
  return db
    .prepare(
      `SELECT a.*, m.id AS image_id FROM awards a
       LEFT JOIN media m ON m.id = a.media_id
       WHERE a.status = 'published' ORDER BY a.award_year DESC, a.id DESC`
    )
    .all();
}

export function listAlumni() {
  const db = getDb();
  return db
    .prepare(
      `SELECT a.*, m.id AS photo_id FROM alumni a
       LEFT JOIN media m ON m.id = a.media_id
       WHERE a.status = 'published' ORDER BY a.graduation_year DESC, a.id`
    )
    .all();
}

/* ── documents ──────────────────────────────────────────────────────────── */

export function listDocumentsPublic() {
  const db = getDb();
  return db
    .prepare(
      `SELECT d.*, m.mime_type, m.size_bytes, m.original_name FROM documents d
       JOIN media m ON m.id = d.media_id
       WHERE d.is_public = 1 ORDER BY d.category, d.id DESC`
    )
    .all();
}

/* ── gallery & videos ───────────────────────────────────────────────────── */

export function listGalleryAlbums(): any[] {
  const db = getDb();
  const albums = db
    .prepare(`SELECT * FROM gallery_albums WHERE status = 'active' ORDER BY display_order, id`)
    .all() as { id: number; media_id: number | null }[];
  return albums.map((a) => {
    const cover = a.media_id
      ? (db.prepare("SELECT * FROM media WHERE id = ?").get(a.media_id) as MediaRow | undefined)
      : undefined;
    if (!cover) {
      const first = db
        .prepare(
          `SELECT m.* FROM media m JOIN album_media am ON am.media_id = m.id
           WHERE am.album_id = ? ORDER BY am.display_order LIMIT 1`
        )
        .get(a.id) as MediaRow | undefined;
      const count = (
        db.prepare("SELECT COUNT(*) AS n FROM album_media WHERE album_id = ?").get(a.id) as { n: number }
      ).n;
      return { ...a, cover, cover_id: first?.id ?? null, media_count: count };
    }
    const count = (
      db.prepare("SELECT COUNT(*) AS n FROM album_media WHERE album_id = ?").get(a.id) as { n: number }
    ).n;
    return { ...a, cover, cover_id: cover.id, media_count: count };
  });
}

export function getGalleryAlbumBySlug(slug: string): any {
  const db = getDb();
  const album = db.prepare("SELECT * FROM gallery_albums WHERE slug = ? AND status = 'active'").get(slug) as
    | { id: number }
    | undefined;
  if (!album) return null;
  const media = db
    .prepare(
      `SELECT m.* FROM media m JOIN album_media am ON am.media_id = m.id
       WHERE am.album_id = ? ORDER BY am.display_order, m.id`
    )
    .all(album.id) as MediaRow[];
  return { album, media };
}

export function listVideos() {
  return getDb()
    .prepare(`SELECT * FROM videos WHERE status = 'published' ORDER BY display_order, id`)
    .all();
}

/* ── pages ──────────────────────────────────────────────────────────────── */

export function getPageBySlug(slug: string) {
  return getDb()
    .prepare(`SELECT * FROM pages WHERE slug = ? AND status = 'published'`)
    .get(slug);
}

export function listPagesPublic() {
  return getDb().prepare(`SELECT id, title, slug, excerpt FROM pages WHERE status = 'published' ORDER BY id`).all();
}

/* ── global search ──────────────────────────────────────────────────────── */

export interface SearchResult {
  type: string;
  title: string;
  url: string;
  snippet: string;
}

export function searchAll(q: string, limit = 20): SearchResult[] {
  const db = getDb();
  const like = `%${q.replace(/[%_]/g, "\\$&")}%`;
  const results: SearchResult[] = [];

  const addNews = db
    .prepare(
      `SELECT title, slug, excerpt FROM news WHERE status='published' AND (title LIKE ? ESCAPE '\\' OR excerpt LIKE ? ESCAPE '\\' OR content LIKE ? ESCAPE '\\') LIMIT ?`
    )
    .all(like, like, like, limit) as { title: string; slug: string; excerpt: string }[];
  for (const r of addNews) results.push({ type: "news", title: r.title, url: `/news/${r.slug}`, snippet: excerpt(r.excerpt) });

  const addPrograms = db
    .prepare(
      `SELECT name, slug, short_description FROM programs WHERE status='active' AND (name LIKE ? ESCAPE '\\' OR short_description LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\') LIMIT ?`
    )
    .all(like, like, like, limit) as { name: string; slug: string; short_description: string }[];
  for (const r of addPrograms) results.push({ type: "program", title: r.name, url: `/academics/programs/${r.slug}`, snippet: excerpt(r.short_description) });

  const addEvents = db
    .prepare(
      `SELECT title, slug, description FROM events WHERE status='published' AND (title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\') LIMIT ?`
    )
    .all(like, like, limit) as { title: string; slug: string; description: string }[];
  for (const r of addEvents) results.push({ type: "event", title: r.title, url: `/events#${r.slug}`, snippet: excerpt(r.description) });

  const addStaff = db
    .prepare(
      `SELECT name, slug, position, subject FROM staff WHERE status='active' AND (name LIKE ? ESCAPE '\\' OR position LIKE ? ESCAPE '\\' OR subject LIKE ? ESCAPE '\\') LIMIT ?`
    )
    .all(like, like, like, limit) as { name: string; slug: string; position: string; subject: string }[];
  for (const r of addStaff) results.push({ type: "teacher", title: r.name, url: `/about/teachers#${r.slug}`, snippet: [r.position, r.subject].filter(Boolean).join(" · ") });

  const addFaqs = db
    .prepare(
      `SELECT question, answer FROM faqs WHERE status='published' AND (question LIKE ? ESCAPE '\\' OR answer LIKE ? ESCAPE '\\') LIMIT ?`
    )
    .all(like, like, limit) as { question: string; answer: string }[];
  for (const r of addFaqs) results.push({ type: "faq", title: r.question, url: `/faq`, snippet: excerpt(r.answer) });

  const addPages = db
    .prepare(
      `SELECT title, slug, excerpt FROM pages WHERE status='published' AND (title LIKE ? ESCAPE '\\' OR content LIKE ? ESCAPE '\\') LIMIT ?`
    )
    .all(like, like, limit) as { title: string; slug: string; excerpt: string }[];
  for (const r of addPages) results.push({ type: "page", title: r.title, url: `/pages/${r.slug}`, snippet: excerpt(r.excerpt) });

  return results;
}

/* ── sitemap entries ────────────────────────────────────────────────────── */

export function sitemapEntries(): { url: string; lastModified?: string }[] {
  const db = getDb();
  const entries: { url: string; lastModified?: string }[] = [];

  const news = db
    .prepare(`SELECT slug, updated_at FROM news WHERE status='published'`)
    .all() as { slug: string; updated_at: string }[];
  for (const r of news) entries.push({ url: `/news/${r.slug}`, lastModified: r.updated_at });

  const programs = db
    .prepare(`SELECT slug, updated_at FROM programs WHERE status='active'`)
    .all() as { slug: string; updated_at: string }[];
  for (const r of programs) entries.push({ url: `/academics/programs/${r.slug}`, lastModified: r.updated_at });

  const events = db
    .prepare(`SELECT slug, updated_at FROM events WHERE status='published'`)
    .all() as { slug: string; updated_at: string }[];
  for (const r of events) entries.push({ url: `/events/${r.slug}`, lastModified: r.updated_at });

  const pages = db
    .prepare(`SELECT slug, updated_at FROM pages WHERE status='published'`)
    .all() as { slug: string; updated_at: string }[];
  for (const r of pages) entries.push({ url: `/pages/${r.slug}`, lastModified: r.updated_at });

  const staff = db
    .prepare(`SELECT slug, updated_at FROM staff WHERE status='active'`)
    .all() as { slug: string; updated_at: string }[];
  for (const r of staff) entries.push({ url: `/about/teachers#${r.slug}`, lastModified: r.updated_at });

  const albums = db
    .prepare(`SELECT slug, updated_at FROM gallery_albums WHERE status='active'`)
    .all() as { slug: string; updated_at: string }[];
  for (const r of albums) entries.push({ url: `/gallery/${r.slug}`, lastModified: r.updated_at });

  return entries;
}
