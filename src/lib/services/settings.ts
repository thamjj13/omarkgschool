import { getDb, withTransaction } from "../db/client";
import { nowIso } from "../utils";

/* ── site settings (key/value) ──────────────────────────────────────────── */

export function getAllSettings(): Record<string, string> {
  const rows = getDb().prepare("SELECT key, value FROM site_settings").all() as {
    key: string;
    value: string;
  }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export function getSetting(key: string, fallback = ""): string {
  const row = getDb().prepare("SELECT value FROM site_settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? fallback;
}

export function saveSettings(values: Record<string, string>): void {
  const db = getDb();
  withTransaction(() => {
    const stmt = db.prepare(
      `INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    );
    for (const [key, value] of Object.entries(values)) {
      stmt.run(key, value, nowIso());
    }
  });
}

/* ── navigation ─────────────────────────────────────────────────────────── */

export interface NavItem {
  id: number;
  parent_id: number | null;
  label: string;
  url: string;
  type: string;
  target: string;
  location: string;
  display_order: number;
  status: string;
}

export function listNavigation(location?: "header" | "footer" | "both"): NavItem[] {
  const db = getDb();
  if (location && location !== "both") {
    return db
      .prepare(
        `SELECT * FROM navigation_items WHERE location IN ('both', ?) AND status = 'active' ORDER BY display_order, id`
      )
      .all(location) as NavItem[];
  }
  return db
    .prepare(`SELECT * FROM navigation_items WHERE status = 'active' ORDER BY display_order, id`)
    .all() as NavItem[];
}

export function listAllNavigation(): NavItem[] {
  return getDb()
    .prepare(`SELECT * FROM navigation_items ORDER BY display_order, id`)
    .all() as NavItem[];
}

export function createNavigationItem(input: Omit<NavItem, "id">): NavItem {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO navigation_items (parent_id, label, url, type, target, location, display_order, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.parent_id ?? null,
      input.label,
      input.url,
      input.type,
      input.target,
      input.location,
      input.display_order,
      input.status
    );
  return db.prepare("SELECT * FROM navigation_items WHERE id = ?").get(Number(result.lastInsertRowid)) as NavItem;
}

export function updateNavigationItem(
  id: number,
  input: Partial<Omit<NavItem, "id">>
): NavItem {
  const db = getDb();
  const current = db.prepare("SELECT * FROM navigation_items WHERE id = ?").get(id) as NavItem | undefined;
  if (!current) throw new Error("Navigation item not found");
  const merged = { ...current, ...input, id };
  db.prepare(
    `UPDATE navigation_items SET parent_id=?, label=?, url=?, type=?, target=?, location=?, display_order=?, status=?, updated_at=? WHERE id=?`
  ).run(
    merged.parent_id ?? null,
    merged.label,
    merged.url,
    merged.type,
    merged.target,
    merged.location,
    merged.display_order,
    merged.status,
    nowIso(),
    id
  );
  return db.prepare("SELECT * FROM navigation_items WHERE id = ?").get(id) as NavItem;
}

export function deleteNavigationItem(id: number): void {
  getDb().prepare("DELETE FROM navigation_items WHERE id = ?").run(id);
}

/* ── homepage sections ──────────────────────────────────────────────────── */

export interface HomepageSection {
  id: number;
  key: string;
  type: string;
  title: string;
  subtitle: string;
  body: string;
  media_id: number | null;
  config: string;
  enabled: number;
  display_order: number;
}

export function listHomepageSections(): HomepageSection[] {
  return getDb()
    .prepare(`SELECT * FROM homepage_sections ORDER BY display_order, id`)
    .all() as HomepageSection[];
}

export function listEnabledHomepageSections(): HomepageSection[] {
  return getDb()
    .prepare(`SELECT * FROM homepage_sections WHERE enabled = 1 ORDER BY display_order, id`)
    .all() as HomepageSection[];
}

export function getHomepageSection(id: number): HomepageSection | undefined {
  return getDb().prepare("SELECT * FROM homepage_sections WHERE id = ?").get(id) as
    | HomepageSection
    | undefined;
}

export function saveHomepageSection(
  id: number,
  input: Partial<Omit<HomepageSection, "id">>
): HomepageSection {
  const db = getDb();
  const current = db.prepare("SELECT * FROM homepage_sections WHERE id = ?").get(id) as
    | HomepageSection
    | undefined;
  if (!current) throw new Error("Section not found");
  const merged = { ...current, ...input };
  db.prepare(
    `UPDATE homepage_sections SET key=?, type=?, title=?, subtitle=?, body=?, media_id=?, config=?, enabled=?, display_order=?, updated_at=? WHERE id=?`
  ).run(
    merged.key,
    merged.type,
    merged.title,
    merged.subtitle,
    merged.body,
    merged.media_id ?? null,
    typeof merged.config === "string" ? merged.config : JSON.stringify(merged.config ?? {}),
    merged.enabled ? 1 : 0,
    merged.display_order,
    nowIso(),
    id
  );
  return getHomepageSection(id)!;
}
