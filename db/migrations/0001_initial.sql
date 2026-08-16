-- ============================================================================
-- Maplebrook International Academy — initial schema
-- ============================================================================

-- ── Roles & permissions ─────────────────────────────────────────────────────
CREATE TABLE roles (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE permissions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  resource    TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE role_permissions (
  role_id       INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role_id       INTEGER NOT NULL REFERENCES roles(id),
  status        TEXT NOT NULL DEFAULT 'active',   -- active | inactive
  last_login_at TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE password_reset_tokens (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at    TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX idx_reset_user ON password_reset_tokens(user_id);

-- ── Audit / activity log ────────────────────────────────────────────────────
CREATE TABLE activity_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   TEXT,
  details     TEXT,
  ip          TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX idx_activity_created ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_user ON activity_logs(user_id);

-- ── Departments ─────────────────────────────────────────────────────────────
CREATE TABLE departments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT NOT NULL DEFAULT '',
  icon          TEXT NOT NULL DEFAULT 'book-open',
  display_order INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'active',  -- active | inactive
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- ── Media (central file registry) ───────────────────────────────────────────
CREATE TABLE media (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  filename      TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type     TEXT NOT NULL,
  size_bytes    INTEGER NOT NULL DEFAULT 0,
  width         INTEGER,
  height        INTEGER,
  storage_path  TEXT NOT NULL UNIQUE,
  kind          TEXT NOT NULL DEFAULT 'other',   -- image | pdf | video | other
  alt_text      TEXT NOT NULL DEFAULT '',
  caption       TEXT NOT NULL DEFAULT '',
  is_public     INTEGER NOT NULL DEFAULT 1,
  uploaded_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX idx_media_kind ON media(kind);

-- ── Staff / teachers ────────────────────────────────────────────────────────
CREATE TABLE staff (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  position      TEXT NOT NULL DEFAULT '',
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  subject       TEXT NOT NULL DEFAULT '',
  qualification TEXT NOT NULL DEFAULT '',
  bio           TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT '',
  phone         TEXT NOT NULL DEFAULT '',
  media_id      INTEGER REFERENCES media(id) ON DELETE SET NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_featured   INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX idx_staff_dept ON staff(department_id);

-- ── Academic programs ───────────────────────────────────────────────────────
CREATE TABLE programs (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL DEFAULT '',
  description       TEXT NOT NULL DEFAULT '',
  grade_level       TEXT NOT NULL DEFAULT '',
  duration          TEXT NOT NULL DEFAULT '',
  capacity          INTEGER NOT NULL DEFAULT 0,
  curriculum        TEXT NOT NULL DEFAULT '',
  department_id     INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  media_id          INTEGER REFERENCES media(id) ON DELETE SET NULL,
  display_order     INTEGER NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'active',
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- ── News ────────────────────────────────────────────────────────────────────
CREATE TABLE news (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  excerpt      TEXT NOT NULL DEFAULT '',
  content      TEXT NOT NULL DEFAULT '',
  category     TEXT NOT NULL DEFAULT 'General',
  media_id     INTEGER REFERENCES media(id) ON DELETE SET NULL,
  author_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'draft',    -- draft | published
  is_featured  INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  scheduled_at TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX idx_news_status ON news(status, published_at DESC);
CREATE INDEX idx_news_category ON news(category);

-- ── Announcements ───────────────────────────────────────────────────────────
CREATE TABLE announcements (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL DEFAULT '',
  type       TEXT NOT NULL DEFAULT 'info',       -- info | success | warning | urgent
  status     TEXT NOT NULL DEFAULT 'published',
  priority   INTEGER NOT NULL DEFAULT 0,
  starts_at  TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- ── Events ──────────────────────────────────────────────────────────────────
CREATE TABLE events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  event_type  TEXT NOT NULL DEFAULT 'General',
  start_date  TEXT NOT NULL DEFAULT '',
  end_date    TEXT NOT NULL DEFAULT '',
  start_time  TEXT NOT NULL DEFAULT '',
  end_time    TEXT NOT NULL DEFAULT '',
  location    TEXT NOT NULL DEFAULT '',
  media_id    INTEGER REFERENCES media(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'published',
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX idx_events_start ON events(start_date);

-- ── Gallery ─────────────────────────────────────────────────────────────────
CREATE TABLE gallery_albums (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT NOT NULL DEFAULT '',
  media_id      INTEGER REFERENCES media(id) ON DELETE SET NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE album_media (
  album_id      INTEGER NOT NULL REFERENCES gallery_albums(id) ON DELETE CASCADE,
  media_id      INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (album_id, media_id)
);

-- ── Videos ──────────────────────────────────────────────────────────────────
CREATE TABLE videos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT NOT NULL DEFAULT '',
  provider      TEXT NOT NULL DEFAULT 'youtube',
  video_url     TEXT NOT NULL DEFAULT '',
  embed_url     TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'published',
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- ── Achievements ────────────────────────────────────────────────────────────
CREATE TABLE achievements (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  description      TEXT NOT NULL DEFAULT '',
  category         TEXT NOT NULL DEFAULT 'Academic',
  student_name     TEXT NOT NULL DEFAULT '',
  achievement_date TEXT NOT NULL DEFAULT '',
  media_id         INTEGER REFERENCES media(id) ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'published',
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- ── Awards ──────────────────────────────────────────────────────────────────
CREATE TABLE awards (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  awarder     TEXT NOT NULL DEFAULT '',
  recipient   TEXT NOT NULL DEFAULT '',
  award_year  TEXT NOT NULL DEFAULT '',
  media_id    INTEGER REFERENCES media(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'published',
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- ── Testimonials ────────────────────────────────────────────────────────────
CREATE TABLE testimonials (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  role_title    TEXT NOT NULL DEFAULT '',
  affiliation   TEXT NOT NULL DEFAULT 'Parent',
  quote         TEXT NOT NULL DEFAULT '',
  rating        INTEGER NOT NULL DEFAULT 5,
  media_id      INTEGER REFERENCES media(id) ON DELETE SET NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'published',
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- ── FAQs ────────────────────────────────────────────────────────────────────
CREATE TABLE faqs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  question      TEXT NOT NULL,
  answer        TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL DEFAULT 'General',
  display_order INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'published',
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- ── Documents ───────────────────────────────────────────────────────────────
CREATE TABLE documents (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  title          TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  description    TEXT NOT NULL DEFAULT '',
  category       TEXT NOT NULL DEFAULT 'General',
  media_id       INTEGER NOT NULL REFERENCES media(id) ON DELETE SET NULL,
  is_public      INTEGER NOT NULL DEFAULT 1,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- ── Admissions ──────────────────────────────────────────────────────────────
CREATE TABLE admissions (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  application_no       TEXT NOT NULL UNIQUE,
  student_first_name   TEXT NOT NULL,
  student_last_name    TEXT NOT NULL,
  date_of_birth        TEXT NOT NULL DEFAULT '',
  gender               TEXT NOT NULL DEFAULT '',
  grade_applying_for   TEXT NOT NULL DEFAULT '',
  previous_school      TEXT NOT NULL DEFAULT '',
  guardian_name        TEXT NOT NULL DEFAULT '',
  guardian_relation    TEXT NOT NULL DEFAULT '',
  guardian_email       TEXT NOT NULL DEFAULT '',
  guardian_phone       TEXT NOT NULL DEFAULT '',
  address              TEXT NOT NULL DEFAULT '',
  city                 TEXT NOT NULL DEFAULT '',
  country              TEXT NOT NULL DEFAULT '',
  message              TEXT NOT NULL DEFAULT '',
  status               TEXT NOT NULL DEFAULT 'pending', -- pending | reviewing | accepted | rejected
  reviewed_by          INTEGER REFERENCES users(id) ON DELETE SET NULL,
  review_notes         TEXT NOT NULL DEFAULT '',
  submitted_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX idx_admissions_status ON admissions(status);

-- ── Contact messages & newsletter ───────────────────────────────────────────
CREATE TABLE contact_messages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  phone        TEXT NOT NULL DEFAULT '',
  subject      TEXT NOT NULL DEFAULT '',
  message      TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'unread',   -- unread | read | responded
  is_newsletter INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX idx_contact_status ON contact_messages(status);

CREATE TABLE newsletter_subscribers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL UNIQUE,
  status     TEXT NOT NULL DEFAULT 'subscribed',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- ── Alumni ──────────────────────────────────────────────────────────────────
CREATE TABLE alumni (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  graduation_year TEXT NOT NULL DEFAULT '',
  current_role    TEXT NOT NULL DEFAULT '',
  employer        TEXT NOT NULL DEFAULT '',
  program         TEXT NOT NULL DEFAULT '',
  bio             TEXT NOT NULL DEFAULT '',
  email           TEXT NOT NULL DEFAULT '',
  linkedin        TEXT NOT NULL DEFAULT '',
  media_id        INTEGER REFERENCES media(id) ON DELETE SET NULL,
  is_featured     INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'published',
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- ── Pages (CMS) ─────────────────────────────────────────────────────────────
CREATE TABLE pages (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  excerpt          TEXT NOT NULL DEFAULT '',
  content          TEXT NOT NULL DEFAULT '',
  meta_title       TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'draft',
  is_system        INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX idx_pages_status ON pages(status);

-- ── Site settings, navigation, homepage sections ────────────────────────────
CREATE TABLE site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  group_name TEXT NOT NULL DEFAULT 'general',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE navigation_items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id     INTEGER REFERENCES navigation_items(id) ON DELETE SET NULL,
  label         TEXT NOT NULL,
  url           TEXT NOT NULL DEFAULT '#',
  type          TEXT NOT NULL DEFAULT 'internal', -- internal | external
  target        TEXT NOT NULL DEFAULT '_self',
  location      TEXT NOT NULL DEFAULT 'header',   -- header | footer | both
  display_order INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE homepage_sections (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  key           TEXT NOT NULL UNIQUE,
  type          TEXT NOT NULL,
  title         TEXT NOT NULL DEFAULT '',
  subtitle      TEXT NOT NULL DEFAULT '',
  body          TEXT NOT NULL DEFAULT '',
  media_id      INTEGER REFERENCES media(id) ON DELETE SET NULL,
  config        TEXT NOT NULL DEFAULT '{}',
  enabled       INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
