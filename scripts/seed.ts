/**
 * Seed script — populates the database with realistic fictional demo data.
 * Idempotent-ish: run once on a fresh database (it skips if users exist).
 *
 *   npm run db:seed
 */
import fs from "node:fs";
import path from "node:path";
import { getDb, closeDb, withTransaction } from "../src/lib/db/client";
import { hashPassword } from "../src/lib/auth/password";
import { PERMISSIONS, ROLE_DEFINITIONS } from "../src/lib/auth/rbac";
import { config } from "../src/lib/config";

const db = getDb();
const UPLOADS = config.uploadDir;
const SEED_IMG = path.resolve(process.cwd(), "public", "images", "seed");

const now = () => new Date().toISOString();
const daysFromNow = (n: number) =>
  new Date(Date.now() + n * 86400_000).toISOString().slice(0, 10);

let insertId = 0;
function ins(table: string, row: Record<string, unknown>): number {
  const cols = Object.keys(row);
  const placeholders = cols.map(() => "?").join(", ");
  const values = cols.map((c) => {
    const v = row[c];
    if (v === undefined) return null;
    if (typeof v === "boolean") return v ? 1 : 0;
    return v as string | number | null;
  });
  db.prepare(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`).run(...values);
  const id = (db.prepare("SELECT last_insert_rowid() AS id").get() as { id: number }).id;
  return id;
}

/** Copy a seed image into the uploads dir and register it as media. */
function seedImage(name: string, alt: string, caption = ""): number {
  const src = path.join(SEED_IMG, name);
  const destDir = path.join(UPLOADS, "seed");
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, name);
  if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
  return ins("media", {
    filename: name,
    original_name: name,
    mime_type: name.endsWith(".png") ? "image/png" : "image/jpeg",
    size_bytes: fs.statSync(src).size,
    width: null,
    height: null,
    storage_path: `seed/${name}`,
    kind: "image",
    alt_text: alt,
    caption,
    is_public: 1,
    created_at: now(),
  });
}

/** Minimal, valid single-page PDF generator (for demo documents). */
function makePdf(title: string, body: string): Buffer {
  const esc = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const lines = body.split("\n").map((l) => esc(l));
  const content = [
    "BT",
    "/F1 18 Tf 72 740 Td",
    `(${esc(title)}) Tj`,
    "/F1 11 Tf 0 -28 Td",
    ...lines.map((l) => `(${l}) Tj 0 -16 Td`),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

function seedDocument(title: string, category: string, description: string, file: string, body: string): number {
  const pdf = makePdf(title, body);
  const destDir = path.join(UPLOADS, "seed");
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, file);
  if (!fs.existsSync(dest)) fs.writeFileSync(dest, pdf);
  const mediaId = ins("media", {
    filename: file,
    original_name: file,
    mime_type: "application/pdf",
    size_bytes: pdf.length,
    storage_path: `seed/${file}`,
    kind: "pdf",
    alt_text: title,
    is_public: 1,
    created_at: now(),
  });
  return ins("documents", {
    title,
    slug: file.replace(/\.pdf$/, ""),
    description,
    category,
    media_id: mediaId,
    is_public: 1,
    download_count: 0,
    created_at: now(),
    updated_at: now(),
  });
}

async function main() {
  const existing = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  if (existing.n > 0) {
    console.log("Database already seeded — skipping.");
    closeDb();
    return;
  }

  withTransaction(() => {
    /* ── roles & permissions ─────────────────────────────────────────── */
    for (const p of PERMISSIONS) {
      ins("permissions", { slug: p.slug, name: p.name, resource: p.resource, description: p.description });
    }
    const roleIds: Record<string, number> = {};
    for (const r of ROLE_DEFINITIONS) {
      roleIds[r.slug] = ins("roles", { slug: r.slug, name: r.name, description: r.description });
    }
    const permIdBySlug = new Map<string, number>(
      (db.prepare("SELECT id, slug FROM permissions").all() as { id: number; slug: string }[]).map((r) => [r.slug, r.id])
    );
    for (const r of ROLE_DEFINITIONS) {
      for (const slug of r.permissions) {
        ins("role_permissions", { role_id: roleIds[r.slug], permission_id: permIdBySlug.get(slug) });
      }
    }

    /* ── settings ────────────────────────────────────────────────────── */
    const settings: Record<string, string> = {
      school_name: "Maplebrook International Academy",
      tagline: "Where curiosity grows into confidence.",
      motto: "Learn with purpose. Lead with heart.",
      description:
        "Maplebrook International Academy is a forward-thinking school offering a holistic, globally-minded education from early years through secondary school.",
      founded_year: "1998",
      phone: "+1 (555) 010-2030",
      email: "hello@maplebrook.edu",
      admission_email: "admissions@maplebrook.edu",
      address: "42 Cedar Lane, Riverside District, Portland, OR 97204, United States",
      working_hours: "Mon – Fri · 7:30 AM – 4:00 PM",
      map_embed_url: "https://www.google.com/maps?q=Portland%20Oregon&output=embed",
      facebook: "https://facebook.com",
      twitter: "https://x.com",
      instagram: "https://instagram.com",
      youtube: "https://youtube.com",
      linkedin: "https://linkedin.com",
      meta_title: "Maplebrook International Academy",
      meta_description:
        "A modern international academy offering outstanding academics, arts, athletics and character education.",
      stats_students: "1180",
      stats_teachers: "96",
      stats_graduates: "2400",
      stats_awards: "58",
    };
    for (const [k, v] of Object.entries(settings)) {
      ins("site_settings", { key: k, value: v, group_name: "general", updated_at: now() });
    }

    /* ── media (seed images) ─────────────────────────────────────────── */
    const hero = seedImage("hero-campus.jpg", "Maplebrook Academy campus at golden hour", "Our main campus building");
    const welcome = seedImage("welcome.jpg", "Students engaged in a classroom activity", "Hands-on learning");
    const principal = seedImage("principal.jpg", "Dr. Eleanor Vance, Principal", "Dr. Eleanor Vance");
    const imgScience = seedImage("gallery-science.jpg", "Chemistry experiment in the science lab", "Science fair");
    const imgSports = seedImage("gallery-sports.jpg", "Students playing football", "Sports day");
    const imgArts = seedImage("gallery-arts.jpg", "Painting in the art studio", "Art class");
    const imgLibrary = seedImage("gallery-library.jpg", "Reading in the school library", "The library");
    const imgGraduation = seedImage("gallery-graduation.jpg", "Graduation ceremony", "Class of 2026");

    /* ── navigation ──────────────────────────────────────────────────── */
    const navAbout = ins("navigation_items", { label: "About", url: "/about", type: "internal", target: "_self", location: "header", display_order: 2, status: "active", created_at: now(), updated_at: now() });
    ins("navigation_items", { parent_id: navAbout, label: "Mission & Vision", url: "/about/mission", type: "internal", target: "_self", location: "header", display_order: 1, status: "active", created_at: now(), updated_at: now() });
    ins("navigation_items", { parent_id: navAbout, label: "Principal's Message", url: "/about/principal", type: "internal", target: "_self", location: "header", display_order: 2, status: "active", created_at: now(), updated_at: now() });
    ins("navigation_items", { parent_id: navAbout, label: "Our Teachers", url: "/about/teachers", type: "internal", target: "_self", location: "header", display_order: 3, status: "active", created_at: now(), updated_at: now() });
    const navAcad = ins("navigation_items", { label: "Academics", url: "/academics", type: "internal", target: "_self", location: "header", display_order: 3, status: "active", created_at: now(), updated_at: now() });
    ins("navigation_items", { parent_id: navAcad, label: "Programs", url: "/academics/programs", type: "internal", target: "_self", location: "header", display_order: 1, status: "active", created_at: now(), updated_at: now() });
    ins("navigation_items", { parent_id: navAcad, label: "Departments", url: "/academics/departments", type: "internal", target: "_self", location: "header", display_order: 2, status: "active", created_at: now(), updated_at: now() });
    ins("navigation_items", { label: "Achievements", url: "/achievements", type: "internal", target: "_self", location: "header", display_order: 4, status: "active", created_at: now(), updated_at: now() });
    ins("navigation_items", { label: "News", url: "/news", type: "internal", target: "_self", location: "header", display_order: 5, status: "active", created_at: now(), updated_at: now() });
    ins("navigation_items", { label: "Events", url: "/events", type: "internal", target: "_self", location: "header", display_order: 6, status: "active", created_at: now(), updated_at: now() });
    ins("navigation_items", { label: "Gallery", url: "/gallery", type: "internal", target: "_self", location: "header", display_order: 7, status: "active", created_at: now(), updated_at: now() });
    ins("navigation_items", { label: "Admissions", url: "/admissions", type: "internal", target: "_self", location: "header", display_order: 8, status: "active", created_at: now(), updated_at: now() });
    ins("navigation_items", { label: "Contact", url: "/contact", type: "internal", target: "_self", location: "header", display_order: 9, status: "active", created_at: now(), updated_at: now() });

    const footerLinks = [
      ["About Us", "/about"],
      ["Admissions", "/admissions"],
      ["News", "/news"],
      ["Events", "/events"],
      ["Gallery", "/gallery"],
      ["FAQ", "/faq"],
      ["Alumni", "/alumni"],
      ["Downloads", "/downloads"],
      ["Contact", "/contact"],
    ];
    footerLinks.forEach(([label, url], i) =>
      ins("navigation_items", { label, url, type: "internal", target: "_self", location: "footer", display_order: i + 1, status: "active", created_at: now(), updated_at: now() })
    );

    /* ── users ───────────────────────────────────────────────────────── */
    const adminRole = roleIds.super_admin;
    const editorRole = roleIds.editor;
    const staffRole = roleIds.staff;

    void staffRole;
    void adminRole;
    void editorRole;
    ins("users", {
      name: config.admin.name,
      email: config.admin.email,
      password_hash: "", // set below (bcrypt is async)
      role_id: roleIds.super_admin,
      status: "active",
      created_at: now(),
      updated_at: now(),
    });
    ins("users", {
      name: "Priya Raman",
      email: "editor@maplebrook.edu",
      password_hash: "", // set below
      role_id: roleIds.editor,
      status: "active",
      created_at: now(),
      updated_at: now(),
    });
    ins("users", {
      name: "James Carter",
      email: "staff@maplebrook.edu",
      password_hash: "", // set below
      role_id: roleIds.staff,
      status: "active",
      created_at: now(),
      updated_at: now(),
    });

    /* ── departments ─────────────────────────────────────────────────── */
    const deptMath = ins("departments", { name: "Mathematics", slug: "mathematics", description: "Algebra, calculus, statistics and problem-solving through exploration.", icon: "calculator", display_order: 1, status: "active", created_at: now(), updated_at: now() });
    const deptSci = ins("departments", { name: "Sciences", slug: "sciences", description: "Biology, chemistry and physics with a strong laboratory programme.", icon: "flask", display_order: 2, status: "active", created_at: now(), updated_at: now() });
    const deptHum = ins("departments", { name: "Humanities", slug: "humanities", description: "History, geography and social studies that connect past and present.", icon: "globe", display_order: 3, status: "active", created_at: now(), updated_at: now() });
    const deptLang = ins("departments", { name: "Languages", slug: "languages", description: "English, Spanish, French and Mandarin language and literature.", icon: "language", display_order: 4, status: "active", created_at: now(), updated_at: now() });
    const deptArts = ins("departments", { name: "Arts & Music", slug: "arts-music", description: "Visual arts, music, drama and design thinking.", icon: "palette", display_order: 5, status: "active", created_at: now(), updated_at: now() });
    const deptPE = ins("departments", { name: "Physical Education", slug: "physical-education", description: "Sports, athletics and lifelong wellbeing.", icon: "trophy", display_order: 6, status: "active", created_at: now(), updated_at: now() });

    /* ── staff ───────────────────────────────────────────────────────── */
    const staffRows: Record<string, unknown>[] = [
      { name: "Dr. Eleanor Vance", slug: "eleanor-vance", position: "Principal", department_id: deptHum, subject: "School Leadership", qualification: "Ed.D. Educational Leadership", email: "e.vance@maplebrook.edu", phone: "+1 (555) 010-2001", media_id: principal, display_order: 1, is_featured: 1, bio: "<p>Dr. Vance has led Maplebrook for over a decade, championing an education that balances academic rigour with genuine care for every child.</p>" },
      { name: "David Okafor", slug: "david-okafor", position: "Head of Mathematics", department_id: deptMath, subject: "Mathematics", qualification: "M.Sc. Applied Mathematics", email: "d.okafor@maplebrook.edu", phone: "+1 (555) 010-2002", media_id: null, display_order: 2, is_featured: 1, bio: "<p>David makes mathematics tangible, from real-world modelling to competitive problem-solving clubs.</p>" },
      { name: "Priya Raman", slug: "priya-raman", position: "Head of Sciences", department_id: deptSci, subject: "Biology & Chemistry", qualification: "Ph.D. Molecular Biology", email: "p.raman@maplebrook.edu", phone: "+1 (555) 010-2003", media_id: null, display_order: 3, is_featured: 1, bio: "<p>Priya leads our STEAM initiatives and runs the award-winning science fair programme.</p>" },
      { name: "Thomas Whitfield", slug: "thomas-whitfield", position: "Head of Humanities", department_id: deptHum, subject: "History & Geography", qualification: "M.A. Modern History", email: "t.whitfield@maplebrook.edu", phone: "+1 (555) 010-2004", media_id: null, display_order: 4, is_featured: 0, bio: "<p>Thomas brings history to life through archives, field trips and debate.</p>" },
      { name: "Sofia Mendes", slug: "sofia-mendes", position: "Head of Languages", department_id: deptLang, subject: "Spanish & French", qualification: "M.A. Modern Languages", email: "s.mendes@maplebrook.edu", phone: "+1 (555) 010-2005", media_id: null, display_order: 5, is_featured: 0, bio: "<p>Sofia builds confident, bilingual communicators through immersive language learning.</p>" },
      { name: "Amara Diallo", slug: "amara-diallo", position: "Director of Arts", department_id: deptArts, subject: "Visual Arts", qualification: "M.F.A. Fine Art", email: "a.diallo@maplebrook.edu", phone: "+1 (555) 010-2006", media_id: null, display_order: 6, is_featured: 0, bio: "<p>Amara curates our galleries and leads the annual arts showcase.</p>" },
      { name: "James Carter", slug: "james-carter", position: "Director of Athletics", department_id: deptPE, subject: "Physical Education", qualification: "B.Sc. Sports Science", email: "j.carter@maplebrook.edu", phone: "+1 (555) 010-2007", media_id: null, display_order: 7, is_featured: 1, bio: "<p>James coaches our football and athletics squads and promotes lifelong fitness.</p>" },
      { name: "Daniel Cho", slug: "daniel-cho", position: "Head of Music", department_id: deptArts, subject: "Music & Choir", qualification: "B.Mus. Composition", email: "d.cho@maplebrook.edu", phone: "+1 (555) 010-2008", media_id: null, display_order: 8, is_featured: 0, bio: "<p>Daniel directs our orchestra, choir and the spring musical.</p>" },
    ];
    for (const r of staffRows) ins("staff", { ...r, status: "active", created_at: now(), updated_at: now() });

    /* ── programs ────────────────────────────────────────────────────── */
    const programs: Record<string, unknown>[] = [
      { name: "Early Years Foundation", slug: "early-years-foundation", short_description: "Play-based learning for ages 3–5 that builds curiosity and confidence.", grade_level: "Pre-K & Kindergarten", duration: "2 years", capacity: 40, curriculum: "EYFS-inspired", department_id: deptHum, media_id: welcome, display_order: 1, description: "<p>Our Early Years programme is a warm, playful introduction to school. Through guided play, storytelling, music and outdoor exploration, children develop early literacy, numeracy and social skills in a nurturing environment.</p><ul><li>Small class sizes with dedicated early-years specialists</li><li>Outdoor learning garden and sensory play spaces</li><li>Regular parent–teacher learning journeys</li></ul>" },
      { name: "Primary School", slug: "primary-school", short_description: "Grades 1–5: strong foundations in literacy, numeracy and the arts.", grade_level: "Grades 1–5", duration: "5 years", capacity: 300, curriculum: "International Primary", department_id: deptMath, media_id: welcome, display_order: 2, description: "<p>The Primary School builds strong foundations across the core subjects while keeping wonder alive. Specialist teachers introduce science, languages, music and physical education from Grade 1.</p><ul><li>Daily guided reading and mathematics</li><li>Weekly specialist lessons in art, music and PE</li><li>Character education woven into every week</li></ul>" },
      { name: "Middle School", slug: "middle-school", short_description: "Grades 6–8: enquiry-led learning that grows independence.", grade_level: "Grades 6–8", duration: "3 years", capacity: 260, curriculum: "International Middle Years", department_id: deptSci, media_id: imgScience, display_order: 3, description: "<p>Middle School is where students become independent learners. Interdisciplinary projects, electives and leadership opportunities help every student discover their strengths.</p><ul><li>Project-based learning across subjects</li><li>Electives in coding, design, drama and debate</li><li>Pastoral care through house system and mentors</li></ul>" },
      { name: "Senior School", slug: "senior-school", short_description: "Grades 9–12: rigorous academics and university preparation.", grade_level: "Grades 9–12", duration: "4 years", capacity: 320, curriculum: "IGCSE & A-Levels", department_id: deptSci, media_id: imgGraduation, display_order: 4, description: "<p>Senior School prepares students for the world's leading universities. With a broad IGCSE programme and specialised A-Level pathways, students graduate ready for whatever comes next.</p><ul><li>University and careers counselling from Grade 9</li><li>Research and internship opportunities</li><li>Leadership through prefect and council roles</li></ul>" },
      { name: "IB Diploma Programme", slug: "ib-diploma-programme", short_description: "A challenging, internationally recognised two-year diploma.", grade_level: "Grades 11–12", duration: "2 years", capacity: 80, curriculum: "International Baccalaureate", department_id: deptLang, media_id: imgLibrary, display_order: 5, description: "<p>The IB Diploma offers a rigorous, balanced education recognised by universities worldwide. Students study six subjects, complete the extended essay, and engage in creativity, activity and service (CAS).</p>" },
      { name: "STEAM & Innovation", slug: "steam-innovation", short_description: "Cross-disciplinary science, technology, engineering, arts and maths.", grade_level: "All grades", duration: "Ongoing", capacity: 0, curriculum: "STEAM", department_id: deptSci, media_id: imgScience, display_order: 6, description: "<p>Our STEAM programme connects classrooms to real-world problem solving — from robotics and coding clubs to the annual innovation fair.</p>" },
    ];
    for (const r of programs) ins("programs", { ...r, status: "active", created_at: now(), updated_at: now() });

    /* ── news ────────────────────────────────────────────────────────── */
    const news = [
      { title: "Maplebrook Tops Regional Science Olympiad", slug: "maplebrook-tops-regional-science-olympiad", category: "Achievements", excerpt: "Our student team took first place at the 2026 Regional Science Olympiad, competing against 32 schools.", media_id: imgScience, content: "<p>We are thrilled to announce that Maplebrook's science team took first place at the 2026 Regional Science Olympiad, outscoring 32 schools across the state.</p><p>The team excelled in events including forensics, tower building and experimental design, and now advances to the national finals this autumn.</p><p>Congratulations to every student and to the Sciences department for their outstanding mentorship.</p>" },
      { title: "Admissions Open for 2027–28 Academic Year", slug: "admissions-open-2027-28", category: "Admissions", excerpt: "Applications for the 2027–28 academic year are now open for all grade levels.", media_id: welcome, content: "<p>We are delighted to open admissions for the 2027–28 academic year, welcoming applications from Early Years through Grade 12.</p><p>Visit our <a href=\"/admissions\">admissions page</a> to book a tour, meet our teachers, and submit an online application. Spaces are limited and allocated on a rolling basis.</p>" },
      { title: "New Library and Innovation Hub Unveiled", slug: "new-library-innovation-hub", category: "Community", excerpt: "Our expanded library and innovation hub opened this week with a makerspace and digital media lab.", media_id: imgLibrary, content: "<p>After months of planning, our expanded library and innovation hub is now open. The space includes a makerspace with 3D printers, a digital media lab, and quiet reading corners for every age group.</p><p>Students can now tinker, prototype and create — turning ideas into real projects.</p>" },
      { title: "Spring Arts Showcase Dazzles Audience", slug: "spring-arts-showcase-2026", category: "Arts", excerpt: "From orchestra to oil paintings, the spring arts showcase celebrated student creativity.", media_id: imgArts, content: "<p>The annual Spring Arts Showcase brought together more than 300 student performers and artists for an evening of music, theatre and visual art.</p><p>Highlights included the senior orchestra's premiere of a student composition and a gallery of more than 150 original artworks.</p>" },
      { title: "Varsity Football Team Reaches State Finals", slug: "varsity-football-state-finals", category: "Sports", excerpt: "Our varsity football team will play in the state finals after an unbeaten season.", media_id: imgSports, content: "<p>In a thrilling semi-final, the Maplebrook varsity football team secured their place in the state finals with a 3–1 victory, capping an unbeaten season.</p><p>The final takes place next month — the whole school community is invited to cheer the team on.</p>" },
      { title: "Grade 12 Graduates Head to Top Universities", slug: "grade-12-graduation-2026", category: "Community", excerpt: "The Class of 2026 celebrated graduation with offers from leading universities worldwide.", media_id: imgGraduation, content: "<p>Last Friday we celebrated the Class of 2026 at a joyous graduation ceremony. Our graduates have earned offers from leading universities across four continents.</p><p>We wish every one of them the very best as they begin their next chapter — and welcome them into our growing alumni community.</p>" },
    ];
    news.forEach((n, i) =>
      ins("news", {
        ...n,
        status: "published",
        is_featured: i < 3 ? 1 : 0,
        published_at: daysFromNow(-(i * 4 + 2)),
        author_user_id: 1,
        created_at: now(),
        updated_at: now(),
      })
    );

    /* ── announcements ───────────────────────────────────────────────── */
    const announcements = [
      { title: "Mid-term examinations begin 7 September", content: "Mid-term examinations for Grades 6–12 run from 7 to 12 September. Full timetables are available on the notice board and student portal.", type: "info", priority: 10 },
      { title: "School closed for Autumn Break", content: "The school will be closed for Autumn Break from 20 to 24 October. Classes resume on Monday, 27 October.", type: "warning", priority: 8 },
      { title: "Parent–Teacher conferences this Friday", content: "Parent–teacher conferences take place this Friday from 2:00 PM. Please book your slots via the school app.", type: "success", priority: 6 },
      { title: "New library hours from next week", content: "From Monday the library will open at 7:00 AM for quiet study. The makerspace closes at 6:00 PM daily.", type: "info", priority: 3 },
    ];
    for (const a of announcements) ins("announcements", { ...a, status: "published", starts_at: now(), expires_at: daysFromNow(60), created_at: now(), updated_at: now() });

    /* ── events ──────────────────────────────────────────────────────── */
    const events = [
      { title: "New Student Orientation Day", slug: "new-student-orientation-2026", event_type: "Admission", start_date: daysFromNow(10), end_date: daysFromNow(10), start_time: "09:00", end_time: "12:00", location: "Main Auditorium", media_id: welcome, description: "<p>A warm welcome for all new students and families, with campus tours, timetables and a chance to meet teachers.</p>" },
      { title: "Autumn Science Fair", slug: "autumn-science-fair-2026", event_type: "Academic", start_date: daysFromNow(24), end_date: daysFromNow(24), start_time: "10:00", end_time: "15:00", location: "Science Block", media_id: imgScience, description: "<p>Students from Grades 5–12 present their research projects. Parents and the community are welcome.</p>" },
      { title: "Annual Sports Day", slug: "annual-sports-day-2026", event_type: "Sports", start_date: daysFromNow(38), end_date: daysFromNow(38), start_time: "08:30", end_time: "16:00", location: "Main Field", media_id: imgSports, description: "<p>House competitions across athletics, relays and team sports. Come cheer for your house!</p>" },
      { title: "Winter Concert & Arts Night", slug: "winter-concert-2026", event_type: "Arts", start_date: daysFromNow(60), end_date: daysFromNow(60), start_time: "18:00", end_time: "20:30", location: "Performing Arts Centre", media_id: imgArts, description: "<p>An evening of music, theatre and visual art from our orchestra, choir and drama society.</p>" },
      { title: "Open House & Campus Tour", slug: "open-house-2026", event_type: "Admission", start_date: daysFromNow(15), end_date: daysFromNow(15), start_time: "09:00", end_time: "13:00", location: "Welcome Centre", media_id: hero, description: "<p>Prospective families are invited to tour the campus, visit classrooms and meet our leadership team.</p>" },
      { title: "Book Week & Author Visit", slug: "book-week-2026", event_type: "Academic", start_date: daysFromNow(45), end_date: daysFromNow(49), start_time: "08:30", end_time: "15:00", location: "Library", media_id: imgLibrary, description: "<p>A week celebrating reading with a visiting children's author, book fair and costume day.</p>" },
    ];
    for (const e of events) ins("events", { ...e, status: "published", created_at: now(), updated_at: now() });

    /* ── gallery albums ──────────────────────────────────────────────── */
    const album1 = ins("gallery_albums", { title: "Campus Life", slug: "campus-life", description: "Everyday moments around our campus.", media_id: hero, display_order: 1, status: "active", created_at: now(), updated_at: now() });
    const album2 = ins("gallery_albums", { title: "Science & STEAM", slug: "science-steam", description: "Experiments, robotics and the innovation fair.", media_id: imgScience, display_order: 2, status: "active", created_at: now(), updated_at: now() });
    const album3 = ins("gallery_albums", { title: "Sports Day", slug: "sports-day", description: "Athletics and team sports.", media_id: imgSports, display_order: 3, status: "active", created_at: now(), updated_at: now() });
    const album4 = ins("gallery_albums", { title: "Arts & Music", slug: "arts-music-gallery", description: "Our creative showcases.", media_id: imgArts, display_order: 4, status: "active", created_at: now(), updated_at: now() });

    const albumMedia: Record<number, number[]> = {
      [album1]: [hero, welcome, imgLibrary, imgGraduation],
      [album2]: [imgScience, welcome],
      [album3]: [imgSports, imgGraduation],
      [album4]: [imgArts, imgLibrary],
    };
    for (const [aid, mids] of Object.entries(albumMedia)) {
      mids.forEach((mid, i) => ins("album_media", { album_id: Number(aid), media_id: mid, display_order: i }));
    }

    /* ── videos ──────────────────────────────────────────────────────── */
    const videos = [
      { title: "Campus Tour 2026", slug: "campus-tour-2026", provider: "youtube", video_url: "https://www.youtube.com/watch?v=yQP4UJhNn0I", embed_url: "https://www.youtube.com/embed/yQP4UJhNn0I", display_order: 1, description: "Take a two-minute tour of our campus and facilities." },
      { title: "A Day in the Life at Maplebrook", slug: "a-day-in-the-life", provider: "youtube", video_url: "https://www.youtube.com/watch?v=MMmOLN5zBLY", embed_url: "https://www.youtube.com/embed/MMmOLN5zBLY", display_order: 2, description: "Follow a Grade 7 student through a typical school day." },
      { title: "Science Fair Highlights", slug: "science-fair-highlights", provider: "youtube", video_url: "https://www.youtube.com/watch?v=4OpBylwH9DU", embed_url: "https://www.youtube.com/embed/4OpBylwH9DU", display_order: 3, description: "The best projects from this year's science fair." },
      { title: "Graduation 2026", slug: "graduation-2026", provider: "youtube", video_url: "https://www.youtube.com/watch?v=xyQY8a-ng6g", embed_url: "https://www.youtube.com/embed/xyQY8a-ng6g", display_order: 4, description: "Celebrating the Class of 2026." },
    ];
    for (const v of videos) ins("videos", { ...v, status: "published", thumbnail_url: "", created_at: now(), updated_at: now() });

    /* ── achievements ────────────────────────────────────────────────── */
    const achievements = [
      { title: "First place — Regional Science Olympiad", slug: "science-olympiad-first-place", category: "Science", student_name: "Team Maplebrook", achievement_date: "2026-03-14", media_id: imgScience, description: "<p>Our science team won first place overall and advanced to the national finals.</p>" },
      { title: "National Young Writers' Award", slug: "young-writers-award", category: "Academic", student_name: "Aisha Bello, Grade 9", achievement_date: "2026-02-10", media_id: imgLibrary, description: "<p>Aisha's short story was selected from over 4,000 entries for a national writing award.</p>" },
      { title: "State Football Championship Finalists", slug: "football-championship", category: "Sports", student_name: "Varsity Team", achievement_date: "2026-05-02", media_id: imgSports, description: "<p>The varsity football team reached the state finals after an unbeaten season.</p>" },
      { title: "Gold at the Inter-School Robotics Challenge", slug: "robotics-gold", category: "Science", student_name: "Robotics Club", achievement_date: "2026-01-25", media_id: imgScience, description: "<p>Our robotics club took gold in the autonomous navigation challenge.</p>" },
      { title: "Best Art Portfolio — District Exhibition", slug: "art-portfolio-award", category: "Arts", student_name: "Mei Lin, Grade 11", achievement_date: "2026-04-18", media_id: imgArts, description: "<p>Mei Lin's portfolio was judged best in the district's senior student exhibition.</p>" },
      { title: "National Spelling Bee Semifinalist", slug: "spelling-bee", category: "Academic", student_name: "Omar Haddad, Grade 6", achievement_date: "2026-03-30", media_id: null, description: "<p>Omar reached the national semifinals of the spelling bee.</p>" },
    ];
    for (const a of achievements) ins("achievements", { ...a, status: "published", created_at: now(), updated_at: now() });

    /* ── awards ──────────────────────────────────────────────────────── */
    const awards = [
      { title: "Outstanding International School 2025", awarder: "Global Education Forum", recipient: "Maplebrook International Academy", award_year: "2025", media_id: hero, description: "Recognised for excellence in holistic education and student wellbeing." },
      { title: "Green School of the Year", awarder: "Eco-Schools Network", recipient: "Maplebrook International Academy", award_year: "2024", media_id: imgLibrary, description: "Awarded for our campus-wide sustainability and environmental education programme." },
      { title: "Best STEM Programme (Regional)", awarder: "STEM Education Council", recipient: "Sciences Department", award_year: "2024", media_id: imgScience, description: "For an outstanding integrated STEM curriculum and innovation fair." },
      { title: "Award for Inclusive Practice", awarder: "National Inclusion Charter", recipient: "Maplebrook International Academy", award_year: "2023", media_id: welcome, description: "For our commitment to inclusive and accessible learning for every student." },
    ];
    for (const a of awards) ins("awards", { ...a, status: "published", created_at: now(), updated_at: now() });

    /* ── testimonials ────────────────────────────────────────────────── */
    const testimonials = [
      { name: "Sarah & Michael Nguyen", role_title: "Parents of two students", affiliation: "Parent", quote: "Maplebrook has given our children confidence, curiosity and a genuine love of learning. The teachers know each child personally.", rating: 5, media_id: null, display_order: 1 },
      { name: "Grace Adeyemi", role_title: "Class of 2018 · Software Engineer", affiliation: "Alumnus", quote: "The critical thinking and confidence I built at Maplebrook carried me through university and into my career.", rating: 5, media_id: null, display_order: 2 },
      { name: "Robert Kim", role_title: "Parent of a Grade 9 student", affiliation: "Parent", quote: "The communication between school and home is outstanding. We always feel part of our son's education.", rating: 5, media_id: null, display_order: 3 },
      { name: "Elena Petrova", role_title: "Grade 11 Student", affiliation: "Student", quote: "The STEAM programme let me build a robot that actually works. School has never been this exciting.", rating: 5, media_id: null, display_order: 4 },
      { name: "David Okafor", role_title: "Head of Mathematics", affiliation: "Teacher", quote: "I joined Maplebrook eight years ago and have never looked back. It's a school where teachers and students grow together.", rating: 5, media_id: null, display_order: 5 },
      { name: "Liam O'Connor", role_title: "Community Partner", affiliation: "Partner", quote: "Our internship partnership with Maplebrook brings us bright, well-prepared students every single year.", rating: 4, media_id: null, display_order: 6 },
    ];
    for (const t of testimonials) ins("testimonials", { ...t, status: "published", created_at: now(), updated_at: now() });

    /* ── faqs ────────────────────────────────────────────────────────── */
    const faqs = [
      { question: "What are the school hours?", answer: "School runs Monday to Friday from 7:30 AM to 4:00 PM, with optional after-school clubs until 5:30 PM.", category: "General", display_order: 1 },
      { question: "How do I apply for admission?", answer: "Complete the online application form on our Admissions page, upload the required documents, and our team will contact you within three working days to arrange an assessment and tour.", category: "Admissions", display_order: 2 },
      { question: "What curriculum does the school follow?", answer: "We follow an international curriculum: Early Years and Primary follow an enquiry-based international programme, Middle School follows the International Middle Years, and Senior School offers IGCSE, A-Levels and the IB Diploma.", category: "Academics", display_order: 3 },
      { question: "Do you offer financial aid or scholarships?", answer: "Yes. We offer merit-based scholarships for academics, arts, and athletics, as well as need-based financial aid. Details are available from the admissions office.", category: "Fees", display_order: 4 },
      { question: "Is school transport available?", answer: "Yes, we operate a network of safe, supervised bus routes across the city. You can request a route map from the school office.", category: "Transport", display_order: 5 },
      { question: "What extracurricular activities are offered?", answer: "We offer more than 40 clubs and activities including robotics, debate, orchestra, drama, sports teams, Model UN and community service.", category: "General", display_order: 6 },
      { question: "How do you support student wellbeing?", answer: "Every student belongs to a house with a dedicated mentor, and we have a full-time wellbeing team including counsellors and a school nurse.", category: "Wellbeing", display_order: 7 },
      { question: "Can international students apply?", answer: "Absolutely. We welcome international students and provide English language support (EAL) and a dedicated international admissions coordinator.", category: "Admissions", display_order: 8 },
    ];
    for (const f of faqs) ins("faqs", { ...f, status: "published", created_at: now(), updated_at: now() });

    /* ── documents ───────────────────────────────────────────────────── */
    seedDocument("School Prospectus 2026", "Prospectus", "Our full prospectus covering academics, campus and admissions.", "school-prospectus-2026.pdf", "Maplebrook International Academy\n\nSchool Prospectus 2026\n\nWelcome to Maplebrook, where curiosity grows into confidence.\n\nInside you will find details of our programmes, campus, and how to apply.");
    seedDocument("Admission Policy & Guidelines", "Policy", "Admission criteria, process and timelines.", "admission-policy.pdf", "Admission Policy & Guidelines\n\n1. Applications are reviewed on a rolling basis.\n2. Entrance assessments are age-appropriate.\n3. Offers are confirmed in writing.");
    seedDocument("Academic Calendar 2026–27", "Calendar", "Term dates, holidays and key events for the academic year.", "academic-calendar-2026-27.pdf", "Academic Calendar 2026-27\n\nAutumn Term: 1 September - 19 December\nSpring Term: 5 January - 2 April\nSummer Term: 20 April - 30 June");
    seedDocument("Medical Consent Form", "Form", "Parental consent form for medical treatment and school trips.", "medical-consent-form.pdf", "Medical Consent Form\n\nI hereby consent to the school administering basic first aid and, in an emergency, seeking medical attention for my child.");

    /* ── alumni ──────────────────────────────────────────────────────── */
    const alumni = [
      { name: "Grace Adeyemi", slug: "grace-adeyemi", graduation_year: "2018", current_role: "Senior Software Engineer", employer: "Northwind Labs", program: "IB Diploma", bio: "<p>Grace builds developer tools used by millions. She credits Maplebrook's computing club for sparking her career.</p>", media_id: null, is_featured: 1 },
      { name: "Marcus Lee", slug: "marcus-lee", graduation_year: "2015", current_role: "Medical Resident", employer: "City General Hospital", program: "A-Levels", bio: "<p>Marcus is completing his residency in paediatrics and volunteers as a mentor for current students.</p>", media_id: null, is_featured: 1 },
      { name: "Sofia Ramirez", slug: "sofia-ramirez", graduation_year: "2019", current_role: "Climate Policy Analyst", employer: "Green Futures Institute", program: "IB Diploma", bio: "<p>Sofia works on climate policy and founded our alumni sustainability network.</p>", media_id: null, is_featured: 1 },
      { name: "James Whitmore", slug: "james-whitmore", graduation_year: "2012", current_role: "Creative Director", employer: "Studio North", program: "A-Levels", bio: "<p>James leads a design studio and returns each year to judge our art showcase.</p>", media_id: null, is_featured: 0 },
      { name: "Amara Osei", slug: "amara-osei", graduation_year: "2020", current_role: "Engineering Student", employer: "State University", program: "IB Diploma", bio: "<p>Amara is studying aerospace engineering after captaining our robotics team.</p>", media_id: null, is_featured: 1 },
      { name: "Daniel Petrov", slug: "daniel-petrov", graduation_year: "2016", current_role: "Professional Footballer", employer: "United FC", program: "A-Levels", bio: "<p>Daniel plays professionally and supports our athletics programme as a guest coach.</p>", media_id: null, is_featured: 0 },
    ];
    for (const a of alumni) ins("alumni", { ...a, email: "", linkedin: "https://linkedin.com", status: "published", created_at: now(), updated_at: now() });

    /* ── pages ───────────────────────────────────────────────────────── */
    ins("pages", {
      title: "Health, Safety & Wellbeing", slug: "health-safety-wellbeing", excerpt: "How we keep every student safe and supported.", status: "published", is_system: 0,
      content: "<p>The safety and wellbeing of every child is our first priority.</p><h2>Safeguarding</h2><p>All staff complete annual safeguarding training, and we maintain clear reporting procedures.</p><h2>Health</h2><p>Our campus has a full-time nurse and a dedicated wellbeing centre.</p>",
      meta_title: "Health, Safety & Wellbeing", meta_description: "Our approach to student safety and wellbeing.", created_at: now(), updated_at: now(),
    });
    ins("pages", {
      title: "Principal's Message", slug: "principal-message", excerpt: "A warm welcome from our Principal, Dr. Eleanor Vance.", status: "published", is_system: 0,
      content: "<p>Dear students, parents and friends of Maplebrook,</p><p>Welcome to our school. Every morning, I watch our students walk through the gates with a mixture of energy, curiosity and joy — and it reminds me why I became an educator.</p><p>At Maplebrook, we believe that academic excellence and genuine happiness belong together. Our teachers know every child by name, challenge them to think deeply, and celebrate their successes — big and small.</p><p>We are committed to nurturing young people who are not only well-prepared for the world's leading universities, but who leave us as kind, curious and courageous human beings.</p><p>I warmly invite you to visit our campus and see Maplebrook in action.</p><p>With warm regards,</p><p><strong>Dr. Eleanor Vance</strong><br/>Principal, Maplebrook International Academy</p>",
      meta_title: "Principal's Message", meta_description: "A warm welcome from our Principal, Dr. Eleanor Vance.", created_at: now(), updated_at: now(),
    });
    ins("pages", {
      title: "Uniform & Dress Code", slug: "uniform-dress-code", excerpt: "Guidance on our school uniform and dress expectations.", status: "published", is_system: 0,
      content: "<p>Our uniform creates a sense of belonging and pride.</p><ul><li>Lower school: navy polo and jumper</li><li>Senior school: blazer, shirt and house tie</li><li>PE kit: house t-shirt and shorts</li></ul>",
      meta_title: "Uniform & Dress Code", meta_description: "School uniform guidance.", created_at: now(), updated_at: now(),
    });

    /* ── sample admissions ───────────────────────────────────────────── */
    ins("admissions", {
      application_no: "MBA-2026-0001", student_first_name: "Emma", student_last_name: "Clark", date_of_birth: "2017-04-12", gender: "Female", grade_applying_for: "Grade 3", previous_school: "Sunrise Primary", guardian_name: "Laura Clark", guardian_relation: "Mother", guardian_email: "laura.clark@example.com", guardian_phone: "+1 (555) 011-2201", address: "10 Orchard Way", city: "Portland", country: "United States", message: "We would love a tour before the assessment.", status: "pending", submitted_at: now(), created_at: now(), updated_at: now(),
    });
    ins("admissions", {
      application_no: "MBA-2026-0002", student_first_name: "Noah", student_last_name: "Haddad", date_of_birth: "2013-09-30", gender: "Male", grade_applying_for: "Grade 6", previous_school: "Riverside Academy", guardian_name: "Omar Haddad", guardian_relation: "Father", guardian_email: "omar.haddad@example.com", guardian_phone: "+1 (555) 011-2202", address: "5 Maple Court", city: "Portland", country: "United States", message: "", status: "reviewing", submitted_at: now(), created_at: now(), updated_at: now(),
    });
    ins("admissions", {
      application_no: "MBA-2026-0003", student_first_name: "Aisha", student_last_name: "Bello", date_of_birth: "2015-01-08", gender: "Female", grade_applying_for: "Grade 5", previous_school: "", guardian_name: "Fatima Bello", guardian_relation: "Mother", guardian_email: "fatima.bello@example.com", guardian_phone: "+1 (555) 011-2203", address: "22 Cedar Lane", city: "Portland", country: "United States", message: "Interested in the STEAM programme.", status: "accepted", submitted_at: now(), created_at: now(), updated_at: now(),
    });

    /* ── sample contact messages ─────────────────────────────────────── */
    ins("contact_messages", { name: "Jennifer Park", email: "j.park@example.com", phone: "", subject: "School tour request", message: "Hello, we would like to arrange a campus tour for our two children next month.", status: "unread", created_at: now(), updated_at: now() });
    ins("contact_messages", { name: "Carlos Mendes", email: "carlos.m@example.com", phone: "+1 (555) 011-2300", subject: "Transport routes", message: "Do you have a bus route serving the east side of the city?", status: "read", created_at: now(), updated_at: now() });
    ins("contact_messages", { name: "Helen Brooks", email: "h.brooks@example.com", phone: "", subject: "Volunteering", message: "I would love to volunteer in the library programme.", status: "responded", created_at: now(), updated_at: now() });

    /* ── newsletter subscribers ──────────────────────────────────────── */
    for (const email of ["parent1@example.com", "parent2@example.com", "alum@example.com", "community@example.com"]) {
      ins("newsletter_subscribers", { email, status: "subscribed", created_at: now() });
    }

    /* ── homepage sections ───────────────────────────────────────────── */
    const sections = [
      { key: "hero", type: "hero", title: "Welcome to Maplebrook", subtitle: "Where curiosity grows into confidence.", body: "A modern international academy nurturing curious, compassionate and capable young people.", media_id: hero, enabled: 1, display_order: 1 },
      { key: "welcome", type: "welcome", title: "A School That Knows Every Child", subtitle: "Welcome to Maplebrook International Academy", body: "<p>For over 25 years, Maplebrook has been a place where students are known by name, challenged to think deeply, and encouraged to follow their curiosity.</p><p>With small classes, specialist teachers and a vibrant campus, we combine academic excellence with a genuine commitment to each child's happiness and growth.</p>", media_id: welcome, enabled: 1, display_order: 2 },
      { key: "stats", type: "stats", title: "Maplebrook at a Glance", subtitle: "Our community in numbers", body: "", media_id: null, enabled: 1, display_order: 3 },
      { key: "mission", type: "mission", title: "Our Mission, Vision & Values", subtitle: "What guides us every day", body: "<p><strong>Mission:</strong> To nurture curious, compassionate and capable young people who think critically, act ethically and lead with confidence in a changing world.</p><p><strong>Vision:</strong> To be a leading international academy where every learner is known, challenged and inspired to reach their full potential.</p><h2>Our Values</h2><ul><li><strong>Integrity</strong> — doing the right thing, even when no one is watching</li><li><strong>Curiosity</strong> — asking bold questions and loving the search for answers</li><li><strong>Excellence</strong> — striving to be our best in everything we do</li><li><strong>Respect</strong> — honouring ourselves, each other and our community</li><li><strong>Community</strong> — belonging, caring and lifting others up</li><li><strong>Courage</strong> — trying, failing, and trying again</li></ul>", media_id: null, enabled: 1, display_order: 4 },
      { key: "programs", type: "programs", title: "Academic Programs", subtitle: "Pathways from Early Years to the IB Diploma", body: "", media_id: null, enabled: 1, display_order: 5 },
      { key: "news", type: "news", title: "Latest News", subtitle: "Stories and announcements from around campus", body: "", media_id: null, enabled: 1, display_order: 6 },
      { key: "events", type: "events", title: "Upcoming Events", subtitle: "Mark your calendar", body: "", media_id: null, enabled: 1, display_order: 7 },
      { key: "testimonials", type: "testimonials", title: "What Our Community Says", subtitle: "Voices from parents, students and alumni", body: "", media_id: null, enabled: 1, display_order: 8 },
      { key: "gallery", type: "gallery", title: "Campus Life", subtitle: "A glimpse of everyday magic", body: "", media_id: null, enabled: 1, display_order: 9 },
      { key: "cta", type: "cta", title: "Begin Your Maplebrook Journey", subtitle: "We'd love to show you around", body: "Book a tour or start your application today.", media_id: null, enabled: 1, display_order: 10 },
    ];
    for (const s of sections) ins("homepage_sections", { ...s, config: "{}", updated_at: now() });

    /* ── sample activity log ─────────────────────────────────────────── */
    ins("activity_logs", { user_id: 1, action: "settings.update", entity_type: "settings", entity_id: null, details: "{}", ip: "127.0.0.1", created_at: daysFromNow(-1) });
    ins("activity_logs", { user_id: 1, action: "news.create", entity_type: "news", entity_id: "1", details: JSON.stringify({ title: "Maplebrook Tops Regional Science Olympiad" }), ip: "127.0.0.1", created_at: daysFromNow(-1) });
  });

  // Password hashes (bcrypt is async — do after the transaction).
  const adminHash = await hashPassword(config.admin.password);
  const editorHash = await hashPassword("Editor123!");
  const staffHash = await hashPassword("Staff123!");
  db.prepare("UPDATE users SET password_hash = ? WHERE email = ?").run(adminHash, config.admin.email);
  db.prepare("UPDATE users SET password_hash = ? WHERE email = ?").run(editorHash, "editor@maplebrook.edu");
  db.prepare("UPDATE users SET password_hash = ? WHERE email = ?").run(staffHash, "staff@maplebrook.edu");

  const counts = (db.prepare("SELECT (SELECT COUNT(*) FROM news) news, (SELECT COUNT(*) FROM events) events, (SELECT COUNT(*) FROM staff) staff, (SELECT COUNT(*) FROM programs) programs, (SELECT COUNT(*) FROM media) media").get() as Record<string, number>);
  console.log("Seed complete ✔");
  console.log(counts);
  console.log(`Admin login: ${config.admin.email} / ${config.admin.password}`);
  console.log("Editor login: editor@maplebrook.edu / Editor123!");
  console.log("Staff login:  staff@maplebrook.edu / Staff123!");
  closeDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
