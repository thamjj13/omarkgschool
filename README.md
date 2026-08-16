# Maplebrook International Academy — School Portfolio Website

A complete, production-ready **full-stack school website and CMS** built with a modern
stack. It presents a fictional school ("Maplebrook International Academy") with an
original design, a fully functional public site, and an authenticated admin dashboard
that manages every piece of content on the site — no code editing required.

> **Note:** This is an original build. It is *inspired by* the breadth and structure of a
> typical school portfolio site, but the design, copy, data, brand, and code are entirely
> original and use only fictional demo data.

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure)
4. [Requirements](#requirements)
5. [Quick start (development)](#quick-start-development)
6. [Environment variables](#environment-variables)
7. [Database & migrations](#database--migrations)
8. [Seed / demo data](#seed--demo-data)
9. [Testing](#testing)
10. [Production build & run](#production-build--run)
11. [Deployment](#deployment)
12. [Security model](#security-model)
13. [File & media handling](#file--media-handling)
14. [Backup & logging](#backup--logging)
15. [FAQ / notes](#faq--notes)

---

## Features

**Public website**

- Dynamic homepage built from editable sections (hero, welcome, stats, mission,
  programs, news, events, testimonials, gallery, CTA)
- About, Mission/Vision/Values, Principal's message, Teachers directory (+ detail pages)
- Academic programs (+ detail) and departments
- Student achievements & school awards
- News with categories, search and pagination · Events calendar (upcoming/past) ·
  Notice board
- Photo gallery (albums + lightbox) · Video gallery (YouTube/Vimeo embeds)
- Admissions information + fully working online application form
- FAQ (accordion), Alumni, Testimonials, downloadable documents
- Contact page with validated form + map · Newsletter subscription
- Global site search, sitemap.xml, robots.txt, Open Graph + JSON-LD structured data,
  per-page SEO titles/descriptions, canonical-friendly URLs
- Fully responsive, accessible (skip links, focus states, ARIA), animated micro-interactions,
  skeleton loaders, empty states

**Admin dashboard** (`/admin`)

- Role-based access control — **Super Admin**, **Editor**, **Staff** with granular permissions
- Dashboard overview with live statistics, alerts, and an audit/activity feed
- Full CRUD for: news, announcements, events, pages, departments, programs, teachers,
  testimonials, achievements, awards, alumni, FAQs, documents, videos
- Media library (upload, search, filter, edit metadata, delete) and gallery album management
- Admissions pipeline (review, statuses, notes), contact inbox, newsletter subscribers
- Site settings, navigation menus, homepage section editor (toggle/reorder/edit), roles & permissions
- Rich-text editor, image/file picker, bulk actions, confirmation dialogs,
  search/filter/sort/pagination throughout
- Real authentication: login, logout, password reset, change password, activity logging

**Engineering**

- Real backend + SQLite database (schema, migrations, seed), no mocks
- Server-side validation (Zod) on every endpoint, client-side validation on every form
- File uploads with type/size/content validation and image optimisation (thumbnails)
- Rate limiting, CSRF (SameSite cookies + Origin checks), HTML sanitisation, parameterised SQL
- Environment-based configuration (no hardcoded secrets)
- Meaningful automated tests (auth, RBAC, validation, CRUD, forms)

---

## Tech stack

| Layer      | Technology |
|------------|------------|
| Framework  | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling    | Tailwind CSS (custom design system) + self-hosted variable fonts |
| Database   | SQLite via Node's built-in `node:sqlite` (no native deps) |
| Auth       | bcryptjs (hashing) + `jose` (signed JWT sessions in httpOnly cookies) |
| Validation | Zod (shared client/server schemas) |
| Uploads    | `sharp` for image metadata/thumbnails, safe file storage |
| Email      | `nodemailer` (optional SMTP; falls back to file-based logging) |
| Tests      | Vitest |

---

## Project structure

```
omarkgschool/
├── db/migrations/          # SQL migrations (applied in order)
├── public/images/seed/     # committed demo imagery used by the seed script
├── scripts/                # migrate.ts, seed.ts, setup.ts
├── src/
│   ├── app/
│   │   ├── (public pages)  # about, academics, news, events, gallery, admissions, ...
│   │   ├── api/            # public + admin API route handlers
│   │   ├── admin/          # dashboard (login + (dashboard) group)
│   │   ├── sitemap.ts, robots.ts, error.tsx, not-found.tsx, layout.tsx
│   ├── components/
│   │   ├── ui/             # buttons, modals, forms, toast, icons, primitives
│   │   ├── layout/         # header, footer, search dialog
│   │   ├── home/           # homepage sections
│   │   └── admin/          # dashboard UI (resource manager, managers)
│   └── lib/
│       ├── db/             # connection, migrations
│       ├── auth/           # password, session, rbac, tokens
│       ├── api/            # response helpers, errors, rate-limit, origin checks
│       ├── services/       # data-access layer (site, forms, users, media, ...)
│       ├── admin/          # resource registry + CRUD engine
│       ├── validators.ts   # shared Zod schemas
│       └── utils/          # slugify, dates, pagination, sanitise
└── tests/                  # Vitest suite
```

---

## Requirements

- **Node.js 22.5+** (the app uses the built-in `node:sqlite` module)
- npm 10+

---

## Quick start (development)

```bash
# 1. install dependencies
npm install

# 2. configure environment
cp .env.example .env
#    edit .env and set a strong AUTH_SECRET

# 3. create the database schema + seed demo data
npm run db:setup        # = migrate + seed

# 4. start the dev server
npm run dev
```

Open http://localhost:3000 for the site and http://localhost:3000/admin for the dashboard.

### Demo logins

| Role        | Email                  | Password     |
|-------------|------------------------|--------------|
| Super Admin | admin@maplebrook.edu   | ChangeMe123! |
| Editor      | editor@maplebrook.edu  | Editor123!   |
| Staff       | staff@maplebrook.edu   | Staff123!    |

> Change these after first login (admin → *Site Settings → My profile*).

---

## Environment variables

Copy `.env.example` to `.env`. All values are read server-side.

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | no | `http://localhost:3000` | Canonical base URL (used for SEO, sitemap, Open Graph, JWT issuer) |
| `AUTH_SECRET` | **yes** (production) | dev fallback | Secret used to sign session JWTs. Generate with `openssl rand -base64 48` |
| `DATABASE_PATH` | no | `./data/app.db` | SQLite file location |
| `UPLOAD_DIR` | no | `./uploads` | Uploaded file storage directory |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | seed only | see `.env.example` | Initial super-admin created by `npm run db:seed` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | no | — | When configured, transactional mail (password reset) is sent via SMTP; otherwise it is written to `/logs/mail` |
| `LOG_LEVEL` | no | `info` (prod) / `debug` (dev) | `debug` / `info` / `warn` / `error` |

---

## Database & migrations

SQLite with a normalised, relational schema (users, roles, permissions, staff,
departments, programs, news, events, announcements, media, gallery albums, videos,
achievements, awards, testimonials, FAQs, documents, admissions, contact messages,
newsletter subscribers, alumni, pages, site settings, navigation, homepage sections,
activity logs) — with foreign keys, indexes and timestamps.

Migrations live in `db/migrations/*.sql` and are applied in filename order, recorded in
the `_migrations` table, each inside a transaction.

```bash
npm run db:migrate   # apply pending migrations
npm run db:seed      # populate demo data
npm run db:setup     # migrate + seed
```

---

## Seed / demo data

`npm run db:seed` populates the site with **fictional** demo data: departments, teachers,
programs, news, events, gallery albums, videos, testimonials, achievements, awards,
FAQs, documents (generated PDFs), sample admissions/messages/subscribers, navigation and
homepage sections. Seed images are committed under `public/images/seed/` and copied into
the uploads directory at seed time.

---

## Testing

```bash
npm test            # run the suite once
npm run test:watch  # watch mode
```

The suite covers password hashing, session token signing/verification, password-reset
tokens (single-use + expiry), role permission assignment, RBAC checks, shared form
validation (admission/contact/newsletter/login), and the content CRUD layer
(create/update/delete, slug uniqueness, HTML sanitisation, search/filter/pagination),
plus public form submission flows. Tests run against a throwaway database in the OS
temp directory — they never touch `data/app.db`.

---

## Production build & run

```bash
npm run build       # creates an optimised production build
npm run start       # serves it (binds 0.0.0.0:3000)
```

The production server applies security headers (including a strict Content-Security-Policy,
HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).

---

## Deployment

### Docker

```bash
docker compose up -d --build
```

The compose file mounts persistent volumes for `/app/data`, `/app/uploads` and
`/app/logs`, reads configuration from `.env`, and restarts automatically. A standalone
`Dockerfile` is also provided.

After the container starts the first time, run the one-time setup inside it:

```bash
docker compose exec app npm run db:setup
```

### Any Node 22.5+ host

1. `npm ci`
2. set `.env` (strong `AUTH_SECRET`, correct `NEXT_PUBLIC_SITE_URL`, optional SMTP)
3. `npm run db:setup`
4. `npm run build && npm run start`
5. Put it behind a reverse proxy (nginx/Caddy) with TLS.

### Reverse proxy example (nginx)

```nginx
server {
  listen 443 ssl;
  server_name school.example.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

---

## Security model

- **Passwords** hashed with bcrypt (cost 12); never stored or logged in plaintext.
- **Sessions** are signed JWTs in `httpOnly`, `SameSite=Lax`, `Secure` (production)
  cookies with a 7-day expiry.
- **Authorization** is enforced server-side on every admin endpoint via role
  permissions (`super_admin`, `editor`, `staff`); the UI merely hides what a user
  cannot access.
- **CSRF**: state-changing endpoints require same-origin (Origin header check) on top of
  SameSite=Lax cookies.
- **Injection**: all SQL uses parameterised statements; HTML content is sanitised
  server-side (scripts, event handlers and `javascript:` URLs are stripped).
- **Rate limiting** on login, password reset, contact, admission and newsletter endpoints.
- **File uploads**: extension + MIME policy, size limits, and content verification
  (image decode, PDF magic bytes). Stored outside the web root with random names.
- **Secrets** come exclusively from environment variables.
- **Audit**: every login/logout and content change is written to the activity log.

---

## File & media handling

Uploads are stored under `uploads/{year}/{month}/{uuid}.{ext}` (configured by
`UPLOAD_DIR`) and registered in the `media` table. Images are served (optionally as
optimised WebP thumbnails) via `/api/media/:id`; private files require an authenticated
admin. Documents are downloaded via `/api/downloads/:id`, which also tracks download
counts. Public/private visibility is configurable per file.

Limits: images ≤ 10 MB, PDFs ≤ 20 MB, video ≤ 100 MB, documents ≤ 20 MB.

---

## Backup & logging

- **Database**: single SQLite file at `DATABASE_PATH`. Back up the file (and its `-wal`/
  `-shm` siblings) or use `sqlite3 data/app.db ".backup backup.db"`.
- **Uploads**: back up the `UPLOAD_DIR` directory.
- **Logs**: application logs are written to `logs/` (daily files); transactional emails
  are written to `logs/mail/` when no SMTP transport is configured. The admin activity
  log is stored in the database (`activity_logs`).

---

## FAQ / notes

- **Why `node:sqlite`?** It removes the need for a native database driver and works
  everywhere Node 22.5+ runs. The data layer is isolated in `src/lib/db`, so it can be
  swapped for PostgreSQL/MySQL via an ORM with minimal changes.
- **Password reset in dev**: without SMTP, the reset link is written to `logs/mail/`
  and also returned by the API in non-production builds so the flow can be tested.
- **Scheduled publishing**: news/announcements accept a `scheduled_at` value; content is
  hidden from the public site until that time.
- **Origin checks**: if you deploy behind a proxy that rewrites the `Host` header,
  ensure it forwards the original host (as shown in the nginx example) so the CSRF
  origin check works correctly.
