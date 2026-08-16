import { getDb } from "../db/client";
import { getSessionUser, type SessionUser } from "./session";
import { ApiError } from "../api/errors";

/* ── permission catalogue ────────────────────────────────────────────────── */

export interface Permission {
  slug: string;
  name: string;
  resource: string;
  description: string;
}

export const PERMISSIONS: Permission[] = [
  { slug: "dashboard.view", name: "View dashboard", resource: "dashboard", description: "Access the admin dashboard and statistics." },
  { slug: "content.manage", name: "Manage content", resource: "content", description: "Create, edit and delete news, announcements, events and pages." },
  { slug: "academics.manage", name: "Manage academics", resource: "academics", description: "Manage departments, academic programs and staff." },
  { slug: "media.manage", name: "Manage media", resource: "media", description: "Upload and delete files in the media library." },
  { slug: "gallery.manage", name: "Manage gallery", resource: "gallery", description: "Manage gallery albums and their images." },
  { slug: "videos.manage", name: "Manage videos", resource: "videos", description: "Manage the video gallery." },
  { slug: "community.manage", name: "Manage community", resource: "community", description: "Manage testimonials, achievements, awards, alumni and FAQs." },
  { slug: "documents.manage", name: "Manage documents", resource: "documents", description: "Manage downloadable documents." },
  { slug: "admissions.manage", name: "Manage admissions", resource: "admissions", description: "Review and process admission applications." },
  { slug: "messages.manage", name: "Manage messages", resource: "messages", description: "Read and respond to contact messages and newsletter subscriptions." },
  { slug: "settings.manage", name: "Manage settings", resource: "settings", description: "Edit site settings, navigation, homepage sections and SEO." },
  { slug: "users.manage", name: "Manage users", resource: "users", description: "Create and manage admin users, roles and permissions." },
  { slug: "activity.view", name: "View activity log", resource: "activity", description: "Inspect the audit / activity log." },
];

export const ROLE_DEFINITIONS = [
  {
    slug: "super_admin",
    name: "Super Admin",
    description: "Full access to every part of the website and dashboard.",
    permissions: PERMISSIONS.map((p) => p.slug),
  },
  {
    slug: "editor",
    name: "Editor",
    description: "Manages website content, media, academics and community pages.",
    permissions: [
      "dashboard.view",
      "content.manage",
      "academics.manage",
      "media.manage",
      "gallery.manage",
      "videos.manage",
      "community.manage",
      "documents.manage",
      "activity.view",
    ],
  },
  {
    slug: "staff",
    name: "Staff",
    description: "Handles admissions, messages and media uploads.",
    permissions: [
      "dashboard.view",
      "admissions.manage",
      "messages.manage",
      "media.manage",
      "activity.view",
    ],
  },
];

/* ── runtime checks ──────────────────────────────────────────────────────── */

export function permissionsForRole(roleSlug: string): Set<string> {
  const def = ROLE_DEFINITIONS.find((r) => r.slug === roleSlug);
  return new Set(def?.permissions ?? []);
}

export function permissionsForUser(userId: number): Set<string> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT p.slug FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       JOIN users u ON u.role_id = rp.role_id
       WHERE u.id = ?`
    )
    .all(userId) as { slug: string }[];
  return new Set(rows.map((r) => r.slug));
}

export function can(user: SessionUser | null, permission: string): boolean {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  return permissionsForUser(user.id).has(permission);
}

/** Require an authenticated user (throws 401 otherwise). */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new ApiError(401, "Authentication required", "UNAUTHORIZED");
  }
  return user;
}

/** Require an authenticated user with the given permission. */
export async function requirePermission(permission: string): Promise<SessionUser> {
  const user = await requireAuth();
  if (!can(user, permission)) {
    throw new ApiError(403, "You do not have permission to perform this action", "FORBIDDEN");
  }
  return user;
}
