import { clsx, type ClassValue } from "clsx";

/** Tailwind-friendly class combiner. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** URL-safe slug from arbitrary text. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Ensure a slug is unique within a table column (excluding a given row id). */
export function uniqueSlug(
  base: string,
  exists: (slug: string) => boolean
): string {
  let slug = slugify(base) || "item";
  let i = 2;
  while (exists(slug)) {
    slug = `${slugify(base)}-${i++}`;
  }
  return slug;
}

export function formatDate(
  value: string | null | undefined,
  opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", opts);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function nowIso(): string {
  return new Date().toISOString();
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function paginate<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): Page<T> {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return { items, total, page, pageSize, totalPages };
}

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "string" ? parseInt(value, 10) : typeof value === "number" ? value : NaN;
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Basic, dependency-free HTML-to-plain-text for excerpts/snippets. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerpt(text: string, max = 160): string {
  const plain = stripHtml(text);
  if (plain.length <= max) return plain;
  return plain.slice(0, max).trimEnd() + "…";
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Extract the YouTube video id from common URL formats. */
export function youtubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/
  );
  return match ? match[1] : null;
}

export function youtubeEmbedUrl(url: string): string {
  const id = youtubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : "";
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

/** Simple deterministic colour for initials avatars. */
export function avatarColor(name: string): string {
  const palette = [
    "bg-brand-100 text-brand-800",
    "bg-accent-100 text-accent-800",
    "bg-sky-100 text-sky-800",
    "bg-rose-100 text-rose-800",
    "bg-violet-100 text-violet-800",
    "bg-amber-100 text-amber-800",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}
