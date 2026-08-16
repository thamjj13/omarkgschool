import { getDb, withTransaction } from "../db/client";
import { clampInt, uniqueSlug } from "../utils";
import { ApiError } from "../api/errors";
import { deleteStoredFile } from "../upload";

export interface MediaRow {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  storage_path: string;
  kind: string;
  alt_text: string;
  caption: string;
  is_public: number;
  uploaded_by: number | null;
  created_at: string;
}

export { mediaUrl } from "../media-url";

export function createMedia(input: {
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  storage_path: string;
  kind: string;
  alt_text?: string;
  caption?: string;
  is_public?: number;
  uploaded_by?: number | null;
}): MediaRow {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO media (filename, original_name, mime_type, size_bytes, width, height, storage_path, kind, alt_text, caption, is_public, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.filename,
      input.original_name,
      input.mime_type,
      input.size_bytes,
      input.width,
      input.height,
      input.storage_path,
      input.kind,
      input.alt_text ?? "",
      input.caption ?? "",
      input.is_public ?? 1,
      input.uploaded_by ?? null
    );
  return getMedia(Number(result.lastInsertRowid))!;
}

export function getMedia(id: number): MediaRow | undefined {
  return getDb().prepare("SELECT * FROM media WHERE id = ?").get(id) as MediaRow | undefined;
}

export function listMedia(query: {
  page?: number;
  pageSize?: number;
  q?: string;
  kind?: string;
}) {
  const db = getDb();
  const page = clampInt(query.page, 1, 100000, 1);
  const pageSize = clampInt(query.pageSize, 1, 100, 24);

  const clauses: string[] = [];
  const params: unknown[] = [];
  if (query.q) {
    clauses.push("(original_name LIKE ? OR alt_text LIKE ? OR caption LIKE ?)");
    params.push(`%${query.q}%`, `%${query.q}%`, `%${query.q}%`);
  }
  if (query.kind && query.kind !== "all") {
    clauses.push("kind = ?");
    params.push(query.kind);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const total = (db.prepare(`SELECT COUNT(*) AS n FROM media ${where}`).get(...params) as { n: number }).n;
  const items = db
    .prepare(`SELECT * FROM media ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, (page - 1) * pageSize) as MediaRow[];

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function updateMediaMeta(
  id: number,
  input: { alt_text?: string; caption?: string; is_public?: number }
): MediaRow {
  const db = getDb();
  const current = getMedia(id);
  if (!current) throw new ApiError(404, "Media not found", "NOT_FOUND");
  db.prepare("UPDATE media SET alt_text = ?, caption = ?, is_public = ? WHERE id = ?").run(
    input.alt_text ?? current.alt_text,
    input.caption ?? current.caption,
    input.is_public ?? current.is_public,
    id
  );
  return getMedia(id)!;
}

export function deleteMedia(id: number): void {
  const db = getDb();
  const media = getMedia(id);
  if (!media) throw new ApiError(404, "Media not found", "NOT_FOUND");

  // A document requires its file — refuse deletion while referenced.
  const usedByDoc = db.prepare("SELECT 1 FROM documents WHERE media_id = ? LIMIT 1").get(id);
  if (usedByDoc) {
    throw new ApiError(409, "This file is attached to a document. Delete or update the document first.", "IN_USE");
  }

  withTransaction(() => {
    db.prepare("DELETE FROM media WHERE id = ?").run(id);
  });
  deleteStoredFile(media.storage_path);
}

/* ── gallery albums & album↔media ───────────────────────────────────────── */

export interface AlbumRow {
  id: number;
  title: string;
  slug: string;
  description: string;
  media_id: number | null;
  display_order: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export function listAlbums(): AlbumRow[] {
  return getDb()
    .prepare(`SELECT * FROM gallery_albums ORDER BY display_order, id`)
    .all() as AlbumRow[];
}

export function getAlbum(id: number) {
  const db = getDb();
  const album = db.prepare("SELECT * FROM gallery_albums WHERE id = ?").get(id) as AlbumRow | undefined;
  if (!album) return null;
  const media = db
    .prepare(
      `SELECT m.* FROM media m JOIN album_media am ON am.media_id = m.id
       WHERE am.album_id = ? ORDER BY am.display_order, m.id`
    )
    .all(id) as MediaRow[];
  return { ...album, media };
}

export function getAlbumBySlug(slug: string) {
  const db = getDb();
  const album = db.prepare("SELECT * FROM gallery_albums WHERE slug = ?").get(slug) as AlbumRow | undefined;
  if (!album) return null;
  return getAlbum(album.id);
}

export function createAlbum(input: {
  title: string;
  slug?: string;
  description?: string;
  media_id?: number | null;
  display_order?: number;
  status?: string;
}): AlbumRow {
  const db = getDb();
  const slug = uniqueSlug(input.slug || input.title, (s) =>
    Boolean(db.prepare("SELECT 1 FROM gallery_albums WHERE slug = ?").get(s))
  );
  const result = db
    .prepare(
      `INSERT INTO gallery_albums (title, slug, description, media_id, display_order, status)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(input.title, slug, input.description ?? "", input.media_id ?? null, input.display_order ?? 0, input.status ?? "active");
  return db.prepare("SELECT * FROM gallery_albums WHERE id = ?").get(Number(result.lastInsertRowid)) as AlbumRow;
}

export function updateAlbum(
  id: number,
  input: Partial<{ title: string; slug: string; description: string; media_id: number | null; display_order: number; status: string }>
): AlbumRow {
  const db = getDb();
  const current = db.prepare("SELECT * FROM gallery_albums WHERE id = ?").get(id) as AlbumRow | undefined;
  if (!current) throw new ApiError(404, "Album not found", "NOT_FOUND");
  const merged = { ...current, ...input };
  if (input.slug && input.slug !== current.slug) {
    merged.slug = uniqueSlug(input.slug, (s) =>
      Boolean(db.prepare("SELECT 1 FROM gallery_albums WHERE slug = ? AND id != ?").get(s, id))
    );
  }
  db.prepare(
    `UPDATE gallery_albums SET title=?, slug=?, description=?, media_id=?, display_order=?, status=?, updated_at=datetime('now') WHERE id=?`
  ).run(merged.title, merged.slug, merged.description, merged.media_id ?? null, merged.display_order, merged.status, id);
  return db.prepare("SELECT * FROM gallery_albums WHERE id = ?").get(id) as AlbumRow;
}

export function deleteAlbum(id: number): void {
  getDb().prepare("DELETE FROM gallery_albums WHERE id = ?").run(id);
}

export function albumMediaIds(albumId: number): number[] {
  const rows = getDb()
    .prepare("SELECT media_id FROM album_media WHERE album_id = ? ORDER BY display_order, media_id")
    .all(albumId) as { media_id: number }[];
  return rows.map((r) => r.media_id);
}

export function setAlbumMedia(albumId: number, mediaIds: number[]): void {
  const db = getDb();
  withTransaction(() => {
    db.prepare("DELETE FROM album_media WHERE album_id = ?").run(albumId);
    const stmt = db.prepare(
      "INSERT OR IGNORE INTO album_media (album_id, media_id, display_order) VALUES (?, ?, ?)"
    );
    mediaIds.forEach((mid, i) => stmt.run(albumId, mid, i));
  });
}

export function albumCoverId(albumId: number): number | null {
  const album = getDb().prepare("SELECT media_id FROM gallery_albums WHERE id = ?").get(albumId) as
    | { media_id: number | null }
    | undefined;
  return album?.media_id ?? null;
}

export function getDocument(id: number) {
  return getDb()
    .prepare(
      `SELECT d.*, m.filename, m.mime_type, m.size_bytes, m.original_name, m.storage_path
       FROM documents d JOIN media m ON m.id = d.media_id WHERE d.id = ?`
    )
    .get(id);
}

export function incrementDownload(id: number): void {
  getDb().prepare("UPDATE documents SET download_count = download_count + 1 WHERE id = ?").run(id);
}

export function countMediaByKind(): Record<string, number> {
  const rows = getDb().prepare("SELECT kind, COUNT(*) AS n FROM media GROUP BY kind").all() as {
    kind: string;
    n: number;
  }[];
  return Object.fromEntries(rows.map((r) => [r.kind, r.n]));
}
