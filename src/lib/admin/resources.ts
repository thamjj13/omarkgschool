import { createCrud } from "../services/crud";
import type { ResourceDefinition, FieldDef, ColumnDef, FieldOption } from "./types";
import {
  newsSchema,
  announcementSchema,
  eventSchema,
  pageSchema,
  departmentSchema,
  programSchema,
  staffSchema,
  testimonialSchema,
  achievementSchema,
  awardSchema,
  faqSchema,
  documentSchema,
  alumniSchema,
  videoSchema,
} from "../validators";
import { youtubeEmbedUrl } from "../utils";
import { nowIso } from "../utils";

/* ── shared option sets ─────────────────────────────────────────────────── */

const opt = (values: string[]): FieldOption[] =>
  values.map((v) => ({ value: v, label: v }));

const STATUS_PUBLISHED = opt(["published", "draft"]);
const STATUS_ACTIVE = opt(["active", "inactive"]);

const STATUS_BADGES: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-800",
  active: "bg-emerald-100 text-emerald-800",
  draft: "bg-amber-100 text-amber-800",
  inactive: "bg-slate-200 text-slate-600",
  pending: "bg-amber-100 text-amber-800",
  reviewing: "bg-sky-100 text-sky-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  unread: "bg-rose-100 text-rose-700",
  read: "bg-slate-200 text-slate-600",
  responded: "bg-emerald-100 text-emerald-800",
  subscribed: "bg-emerald-100 text-emerald-800",
  unsubscribed: "bg-slate-200 text-slate-600",
  super_admin: "bg-violet-100 text-violet-800",
  editor: "bg-sky-100 text-sky-800",
  staff: "bg-emerald-100 text-emerald-800",
};

const NEWS_CATEGORIES = opt(["General", "Academic", "Sports", "Arts", "Community", "Admissions", "Achievements"]);
const EVENT_TYPES = opt(["Academic", "Sports", "Arts", "Community", "Admission", "Holiday", "Examination", "Other"]);
const ACHIEVEMENT_CATS = opt(["Academic", "Sports", "Arts", "Science", "Leadership", "Other"]);
const FAQ_CATS = opt(["General", "Admissions", "Academics", "Fees", "Transport", "Wellbeing"]);
const DOC_CATS = opt(["Prospectus", "Policy", "Form", "Calendar", "Report", "Other"]);
const AFFILIATIONS = opt(["Parent", "Alumnus", "Student", "Teacher", "Partner"]);
const ANNOUNCEMENT_TYPES = opt(["info", "success", "warning", "urgent"]);
const PROVIDERS = opt(["youtube", "vimeo", "mp4"]);

/* ── tiny field builder ─────────────────────────────────────────────────── */

function f(
  name: string,
  label: string,
  type: FieldDef["type"],
  extra: Partial<FieldDef> = {}
): FieldDef {
  return { name, label, type, ...extra };
}

const imageField = (label = "Featured image", required = false): FieldDef =>
  f("media_id", label, "image", { required, help: "Choose or upload an image from the media library." });

const slugField = (): FieldDef =>
  f("slug", "Slug", "text", { placeholder: "Auto-generated from the title if left blank" });

const statusField = (options: FieldOption[] = STATUS_PUBLISHED): FieldDef =>
  f("status", "Status", "select", { required: true, options });

/* ── resource definitions ───────────────────────────────────────────────── */

export const RESOURCES: ResourceDefinition[] = [
  /* ── content ────────────────────────────────────────────────────────── */
  {
    name: "news",
    label: "News Article",
    plural: "News & Articles",
    icon: "newspaper",
    permission: "content.manage",
    description: "Publish news stories and articles for the school website.",
    authorColumn: "author_user_id",
    bulkDelete: true,
    service: createCrud({
      table: "news",
      searchColumns: ["title", "excerpt", "content", "category"],
      filterColumns: ["status", "category"],
      sortableColumns: ["created_at", "published_at", "title"],
      defaultSort: { column: "created_at", dir: "desc" },
      writableColumns: [
        "title", "slug", "excerpt", "content", "category", "media_id",
        "status", "is_featured", "published_at", "scheduled_at", "author_user_id",
      ],
      slugColumn: "slug",
      slugSource: "title",
      sanitizeColumns: ["content"],
      joinClause: "LEFT JOIN media m ON m.id = news.media_id",
      selectExtra: "m.id AS image_id",
      transform: (input, ctx) => {
        const next = { ...input };
        if (next.status === "published" && !next.published_at) {
          next.published_at = nowIso();
        }
        if (ctx === "create" && next.scheduled_at === "") next.scheduled_at = null;
        return next;
      },
    }),
    schema: newsSchema,
    columns: [
      { key: "title", label: "Title", type: "text", sortable: true },
      { key: "category", label: "Category", type: "badge" },
      { key: "status", label: "Status", type: "badge", badgeMap: STATUS_BADGES },
      { key: "published_at", label: "Published", type: "date", sortable: true },
      { key: "created_at", label: "Created", type: "date", sortable: true },
    ] satisfies ColumnDef[],
    fields: [
      f("title", "Title", "text", { required: true, placeholder: "Headline for the story" }),
      slugField(),
      f("category", "Category", "select", { options: NEWS_CATEGORIES }),
      f("excerpt", "Excerpt", "textarea", { help: "Short summary shown on cards and search results." }),
      f("content", "Content", "richtext", { colSpan: 2 }),
      imageField(),
      f("is_featured", "Featured story", "switch"),
      statusField(),
      f("scheduled_at", "Publish at (schedule)", "datetime", {
        help: "Leave empty to publish immediately. Future dates hide the article until then.",
      }),
    ],
    filters: [
      { column: "status", label: "Status", options: STATUS_PUBLISHED },
      { column: "category", label: "Category", options: NEWS_CATEGORIES },
    ],
  },

  {
    name: "announcements",
    label: "Announcement",
    plural: "Announcements",
    icon: "megaphone",
    permission: "content.manage",
    description: "Time-sensitive notices shown on the notice board and ticker.",
    bulkDelete: true,
    service: createCrud({
      table: "announcements",
      searchColumns: ["title", "content"],
      filterColumns: ["status", "type"],
      sortableColumns: ["created_at", "priority"],
      defaultSort: { column: "created_at", dir: "desc" },
      writableColumns: ["title", "content", "type", "status", "priority", "starts_at", "expires_at"],
      sanitizeColumns: ["content"],
    }),
    schema: announcementSchema,
    columns: [
      { key: "title", label: "Title", type: "text", sortable: true },
      { key: "type", label: "Type", type: "badge", badgeMap: { info: "bg-sky-100 text-sky-800", success: "bg-emerald-100 text-emerald-800", warning: "bg-amber-100 text-amber-800", urgent: "bg-rose-100 text-rose-800" } },
      { key: "priority", label: "Priority", type: "number" },
      { key: "status", label: "Status", type: "badge", badgeMap: STATUS_BADGES },
      { key: "expires_at", label: "Expires", type: "date" },
    ] satisfies ColumnDef[],
    fields: [
      f("title", "Title", "text", { required: true }),
      f("content", "Content", "textarea", { required: true }),
      f("type", "Type", "select", { options: ANNOUNCEMENT_TYPES, required: true }),
      f("priority", "Priority", "number", { min: 0, max: 99, help: "Higher shows first." }),
      statusField(),
      f("starts_at", "Visible from", "datetime"),
      f("expires_at", "Visible until", "datetime"),
    ],
    filters: [
      { column: "status", label: "Status", options: STATUS_PUBLISHED },
      { column: "type", label: "Type", options: ANNOUNCEMENT_TYPES },
    ],
  },

  {
    name: "events",
    label: "Event",
    plural: "Events Calendar",
    icon: "calendar",
    permission: "content.manage",
    description: "Manage the school events calendar.",
    bulkDelete: true,
    service: createCrud({
      table: "events",
      searchColumns: ["title", "description", "location"],
      filterColumns: ["status", "event_type"],
      sortableColumns: ["start_date", "created_at", "title"],
      defaultSort: { column: "start_date", dir: "asc" },
      writableColumns: [
        "title", "slug", "description", "event_type", "start_date", "end_date",
        "start_time", "end_time", "location", "media_id", "status",
      ],
      slugColumn: "slug",
      slugSource: "title",
      sanitizeColumns: ["description"],
      joinClause: "LEFT JOIN media m ON m.id = events.media_id",
      selectExtra: "m.id AS image_id",
    }),
    schema: eventSchema,
    columns: [
      { key: "title", label: "Event", type: "text", sortable: true },
      { key: "start_date", label: "Starts", type: "date", sortable: true },
      { key: "event_type", label: "Type", type: "badge" },
      { key: "location", label: "Location", type: "text" },
      { key: "status", label: "Status", type: "badge", badgeMap: STATUS_BADGES },
    ] satisfies ColumnDef[],
    fields: [
      f("title", "Event title", "text", { required: true }),
      slugField(),
      f("event_type", "Type", "select", { options: EVENT_TYPES }),
      f("description", "Description", "richtext", { colSpan: 2 }),
      f("start_date", "Start date", "date", { required: true }),
      f("end_date", "End date", "date"),
      f("start_time", "Start time", "text", { placeholder: "09:00" }),
      f("end_time", "End time", "text", { placeholder: "12:00" }),
      f("location", "Location", "text"),
      imageField("Event image"),
      statusField(),
    ],
    filters: [
      { column: "status", label: "Status", options: STATUS_PUBLISHED },
      { column: "event_type", label: "Type", options: EVENT_TYPES },
    ],
  },

  {
    name: "pages",
    label: "Page",
    plural: "Pages",
    icon: "file-text",
    permission: "content.manage",
    description: "Custom CMS pages rendered at /pages/{slug}.",
    bulkDelete: true,
    service: createCrud({
      table: "pages",
      searchColumns: ["title", "excerpt", "content"],
      filterColumns: ["status"],
      sortableColumns: ["updated_at", "title"],
      defaultSort: { column: "updated_at", dir: "desc" },
      writableColumns: ["title", "slug", "excerpt", "content", "meta_title", "meta_description", "status"],
      slugColumn: "slug",
      slugSource: "title",
      sanitizeColumns: ["content"],
    }),
    schema: pageSchema,
    columns: [
      { key: "title", label: "Title", type: "text", sortable: true },
      { key: "slug", label: "Slug", type: "text" },
      { key: "status", label: "Status", type: "badge", badgeMap: STATUS_BADGES },
      { key: "updated_at", label: "Updated", type: "date", sortable: true },
    ] satisfies ColumnDef[],
    fields: [
      f("title", "Title", "text", { required: true }),
      slugField(),
      f("excerpt", "Excerpt", "textarea"),
      f("content", "Content", "richtext", { colSpan: 2 }),
      f("meta_title", "Meta title", "text", { help: "Overrides the browser tab title for SEO." }),
      f("meta_description", "Meta description", "textarea", { help: "Shown in search engine results (max ~160 chars)." }),
      statusField(),
    ],
    filters: [{ column: "status", label: "Status", options: STATUS_PUBLISHED }],
  },

  /* ── academics ──────────────────────────────────────────────────────── */
  {
    name: "departments",
    label: "Department",
    plural: "Departments",
    icon: "layers",
    permission: "academics.manage",
    description: "Academic departments and faculties.",
    bulkDelete: true,
    service: createCrud({
      table: "departments",
      searchColumns: ["name", "description"],
      filterColumns: ["status"],
      sortableColumns: ["display_order", "name"],
      defaultSort: { column: "display_order", dir: "asc" },
      writableColumns: ["name", "slug", "description", "icon", "display_order", "status"],
      slugColumn: "slug",
      slugSource: "name",
    }),
    schema: departmentSchema,
    columns: [
      { key: "name", label: "Name", type: "text", sortable: true },
      { key: "icon", label: "Icon", type: "text" },
      { key: "display_order", label: "Order", type: "number", sortable: true },
      { key: "status", label: "Status", type: "badge", badgeMap: STATUS_BADGES },
    ] satisfies ColumnDef[],
    fields: [
      f("name", "Name", "text", { required: true }),
      slugField(),
      f("description", "Description", "textarea"),
      f("icon", "Icon key", "text", { placeholder: "e.g. book-open, flask, music, trophy", help: "Matches an icon name in the UI icon set." }),
      f("display_order", "Display order", "number"),
      statusField(STATUS_ACTIVE),
    ],
    filters: [{ column: "status", label: "Status", options: STATUS_ACTIVE }],
  },

  {
    name: "programs",
    label: "Program",
    plural: "Academic Programs",
    icon: "graduation",
    permission: "academics.manage",
    description: "Programs, grades and classes offered by the school.",
    bulkDelete: true,
    service: createCrud({
      table: "programs",
      searchColumns: ["name", "short_description", "description", "grade_level"],
      filterColumns: ["status", "department_id"],
      sortableColumns: ["display_order", "name"],
      defaultSort: { column: "display_order", dir: "asc" },
      writableColumns: [
        "name", "slug", "short_description", "description", "grade_level",
        "duration", "capacity", "curriculum", "department_id", "media_id", "display_order", "status",
      ],
      slugColumn: "slug",
      slugSource: "name",
      sanitizeColumns: ["description"],
      joinClause:
        "LEFT JOIN departments d ON d.id = programs.department_id LEFT JOIN media m ON m.id = programs.media_id",
      selectExtra: "d.name AS department_name, m.id AS image_id",
    }),
    schema: programSchema,
    columns: [
      { key: "name", label: "Program", type: "text", sortable: true },
      { key: "grade_level", label: "Grade level", type: "text" },
      { key: "department_name", label: "Department", type: "text" },
      { key: "status", label: "Status", type: "badge", badgeMap: STATUS_BADGES },
    ] satisfies ColumnDef[],
    fields: [
      f("name", "Program name", "text", { required: true }),
      slugField(),
      f("short_description", "Short description", "textarea"),
      f("description", "Full description", "richtext", { colSpan: 2 }),
      f("grade_level", "Grade level", "text", { placeholder: "e.g. Grade 6 – 8" }),
      f("duration", "Duration", "text", { placeholder: "e.g. 1 academic year" }),
      f("capacity", "Capacity", "number", { min: 0 }),
      f("curriculum", "Curriculum", "text", { placeholder: "e.g. IB Middle Years" }),
      f("department_id", "Department", "select", { options: [] }), // populated at runtime
      imageField("Program image"),
      f("display_order", "Display order", "number"),
      statusField(STATUS_ACTIVE),
    ],
    filters: [{ column: "status", label: "Status", options: STATUS_ACTIVE }],
  },

  {
    name: "teachers",
    label: "Teacher",
    plural: "Teachers & Staff",
    icon: "users",
    permission: "academics.manage",
    description: "The staff directory shown publicly on the website.",
    bulkDelete: true,
    service: createCrud({
      table: "staff",
      searchColumns: ["name", "position", "subject", "qualification"],
      filterColumns: ["status", "department_id"],
      sortableColumns: ["display_order", "name"],
      defaultSort: { column: "display_order", dir: "asc" },
      writableColumns: [
        "name", "slug", "position", "department_id", "subject", "qualification",
        "bio", "email", "phone", "media_id", "display_order", "is_featured", "status",
      ],
      slugColumn: "slug",
      slugSource: "name",
      sanitizeColumns: ["bio"],
      joinClause:
        "LEFT JOIN departments d ON d.id = staff.department_id LEFT JOIN media m ON m.id = staff.media_id",
      selectExtra: "d.name AS department_name, m.id AS photo_id",
    }),
    schema: staffSchema,
    columns: [
      { key: "photo_id", label: "Photo", type: "image" },
      { key: "name", label: "Name", type: "text", sortable: true },
      { key: "position", label: "Position", type: "text" },
      { key: "department_name", label: "Department", type: "text" },
      { key: "status", label: "Status", type: "badge", badgeMap: STATUS_BADGES },
    ] satisfies ColumnDef[],
    fields: [
      f("name", "Full name", "text", { required: true }),
      slugField(),
      f("position", "Position / title", "text", { placeholder: "e.g. Head of Mathematics" }),
      f("department_id", "Department", "select", { options: [] }),
      f("subject", "Subject", "text"),
      f("qualification", "Qualification", "text", { placeholder: "e.g. M.Sc. Mathematics, PGCE" }),
      f("bio", "Biography", "richtext", { colSpan: 2 }),
      imageField("Profile photo"),
      f("email", "Email", "email"),
      f("phone", "Phone", "text"),
      f("is_featured", "Featured on homepage", "switch"),
      f("display_order", "Display order", "number"),
      statusField(STATUS_ACTIVE),
    ],
    filters: [{ column: "status", label: "Status", options: STATUS_ACTIVE }],
  },

  /* ── community ──────────────────────────────────────────────────────── */
  {
    name: "testimonials",
    label: "Testimonial",
    plural: "Testimonials",
    icon: "quote",
    permission: "community.manage",
    description: "Quotes from parents, students and alumni.",
    bulkDelete: true,
    service: createCrud({
      table: "testimonials",
      searchColumns: ["name", "role_title", "quote"],
      filterColumns: ["status", "affiliation"],
      sortableColumns: ["display_order", "name"],
      defaultSort: { column: "display_order", dir: "asc" },
      writableColumns: ["name", "role_title", "affiliation", "quote", "rating", "media_id", "display_order", "status"],
      joinClause: "LEFT JOIN media m ON m.id = testimonials.media_id",
      selectExtra: "m.id AS photo_id",
    }),
    schema: testimonialSchema,
    columns: [
      { key: "name", label: "Name", type: "text", sortable: true },
      { key: "affiliation", label: "Affiliation", type: "badge" },
      { key: "rating", label: "Rating", type: "number" },
      { key: "status", label: "Status", type: "badge", badgeMap: STATUS_BADGES },
    ] satisfies ColumnDef[],
    fields: [
      f("name", "Name", "text", { required: true }),
      f("role_title", "Role / title", "text", { placeholder: "e.g. Parent of Grade 5" }),
      f("affiliation", "Affiliation", "select", { options: AFFILIATIONS }),
      f("quote", "Quote", "textarea", { required: true }),
      f("rating", "Rating (1–5)", "number", { min: 1, max: 5 }),
      imageField("Photo"),
      f("display_order", "Display order", "number"),
      statusField(),
    ],
    filters: [
      { column: "status", label: "Status", options: STATUS_PUBLISHED },
      { column: "affiliation", label: "Affiliation", options: AFFILIATIONS },
    ],
  },

  {
    name: "achievements",
    label: "Achievement",
    plural: "Student Achievements",
    icon: "trophy",
    permission: "community.manage",
    description: "Student and team achievements and recognitions.",
    bulkDelete: true,
    service: createCrud({
      table: "achievements",
      searchColumns: ["title", "description", "student_name"],
      filterColumns: ["status", "category"],
      sortableColumns: ["achievement_date", "title"],
      defaultSort: { column: "achievement_date", dir: "desc" },
      writableColumns: ["title", "slug", "description", "category", "student_name", "achievement_date", "media_id", "status"],
      slugColumn: "slug",
      slugSource: "title",
      sanitizeColumns: ["description"],
      joinClause: "LEFT JOIN media m ON m.id = achievements.media_id",
      selectExtra: "m.id AS image_id",
    }),
    schema: achievementSchema,
    columns: [
      { key: "title", label: "Achievement", type: "text", sortable: true },
      { key: "student_name", label: "Student", type: "text" },
      { key: "category", label: "Category", type: "badge" },
      { key: "achievement_date", label: "Date", type: "date", sortable: true },
      { key: "status", label: "Status", type: "badge", badgeMap: STATUS_BADGES },
    ] satisfies ColumnDef[],
    fields: [
      f("title", "Title", "text", { required: true }),
      slugField(),
      f("student_name", "Student / team name", "text"),
      f("category", "Category", "select", { options: ACHIEVEMENT_CATS }),
      f("achievement_date", "Date", "date"),
      f("description", "Description", "richtext", { colSpan: 2 }),
      imageField("Image"),
      statusField(),
    ],
    filters: [
      { column: "status", label: "Status", options: STATUS_PUBLISHED },
      { column: "category", label: "Category", options: ACHIEVEMENT_CATS },
    ],
  },

  {
    name: "awards",
    label: "Award",
    plural: "Awards & Recognitions",
    icon: "award",
    permission: "community.manage",
    description: "Institutional awards and recognitions.",
    bulkDelete: true,
    service: createCrud({
      table: "awards",
      searchColumns: ["title", "description", "awarder", "recipient"],
      filterColumns: ["status", "award_year"],
      sortableColumns: ["award_year", "title"],
      defaultSort: { column: "award_year", dir: "desc" },
      writableColumns: ["title", "description", "awarder", "recipient", "award_year", "media_id", "status"],
      sanitizeColumns: ["description"],
      joinClause: "LEFT JOIN media m ON m.id = awards.media_id",
      selectExtra: "m.id AS image_id",
    }),
    schema: awardSchema,
    columns: [
      { key: "title", label: "Award", type: "text", sortable: true },
      { key: "awarder", label: "Awarded by", type: "text" },
      { key: "award_year", label: "Year", type: "text", sortable: true },
      { key: "status", label: "Status", type: "badge", badgeMap: STATUS_BADGES },
    ] satisfies ColumnDef[],
    fields: [
      f("title", "Award title", "text", { required: true }),
      f("description", "Description", "textarea"),
      f("awarder", "Awarded by", "text"),
      f("recipient", "Recipient", "text"),
      f("award_year", "Year", "text"),
      imageField("Image"),
      statusField(),
    ],
    filters: [{ column: "status", label: "Status", options: STATUS_PUBLISHED }],
  },

  {
    name: "alumni",
    label: "Alumnus",
    plural: "Alumni",
    icon: "graduation",
    permission: "community.manage",
    description: "Notable alumni featured on the alumni page.",
    bulkDelete: true,
    service: createCrud({
      table: "alumni",
      searchColumns: ["name", "employer", "current_role", "program"],
      filterColumns: ["status", "graduation_year"],
      sortableColumns: ["graduation_year", "name"],
      defaultSort: { column: "graduation_year", dir: "desc" },
      writableColumns: [
        "name", "slug", "graduation_year", "current_role", "employer",
        "program", "bio", "email", "linkedin", "media_id", "is_featured", "status",
      ],
      slugColumn: "slug",
      slugSource: "name",
      sanitizeColumns: ["bio"],
      joinClause: "LEFT JOIN media m ON m.id = alumni.media_id",
      selectExtra: "m.id AS photo_id",
    }),
    schema: alumniSchema,
    columns: [
      { key: "name", label: "Name", type: "text", sortable: true },
      { key: "graduation_year", label: "Class of", type: "text", sortable: true },
      { key: "current_role", label: "Current role", type: "text" },
      { key: "status", label: "Status", type: "badge", badgeMap: STATUS_BADGES },
    ] satisfies ColumnDef[],
    fields: [
      f("name", "Full name", "text", { required: true }),
      slugField(),
      f("graduation_year", "Graduation year", "text"),
      f("current_role", "Current role", "text"),
      f("employer", "Employer / institution", "text"),
      f("program", "Program studied", "text"),
      f("bio", "Bio", "richtext", { colSpan: 2 }),
      imageField("Photo"),
      f("email", "Email", "email"),
      f("linkedin", "LinkedIn URL", "url"),
      f("is_featured", "Featured", "switch"),
      statusField(),
    ],
    filters: [{ column: "status", label: "Status", options: STATUS_PUBLISHED }],
  },

  {
    name: "faqs",
    label: "FAQ",
    plural: "FAQs",
    icon: "help",
    permission: "community.manage",
    description: "Frequently asked questions shown on the FAQ page.",
    bulkDelete: true,
    service: createCrud({
      table: "faqs",
      searchColumns: ["question", "answer"],
      filterColumns: ["status", "category"],
      sortableColumns: ["display_order", "question"],
      defaultSort: { column: "display_order", dir: "asc" },
      writableColumns: ["question", "answer", "category", "display_order", "status"],
    }),
    schema: faqSchema,
    columns: [
      { key: "question", label: "Question", type: "text", sortable: true },
      { key: "category", label: "Category", type: "badge" },
      { key: "display_order", label: "Order", type: "number", sortable: true },
      { key: "status", label: "Status", type: "badge", badgeMap: STATUS_BADGES },
    ] satisfies ColumnDef[],
    fields: [
      f("question", "Question", "text", { required: true }),
      f("answer", "Answer", "textarea", { required: true }),
      f("category", "Category", "select", { options: FAQ_CATS }),
      f("display_order", "Display order", "number"),
      statusField(),
    ],
    filters: [
      { column: "status", label: "Status", options: STATUS_PUBLISHED },
      { column: "category", label: "Category", options: FAQ_CATS },
    ],
  },

  /* ── documents & videos ─────────────────────────────────────────────── */
  {
    name: "documents",
    label: "Document",
    plural: "Documents",
    icon: "download",
    permission: "documents.manage",
    description: "Downloadable documents such as prospectuses, policies and forms.",
    bulkDelete: true,
    service: createCrud({
      table: "documents",
      searchColumns: ["title", "description", "category"],
      filterColumns: ["category", "is_public"],
      sortableColumns: ["id", "title"],
      defaultSort: { column: "id", dir: "desc" },
      writableColumns: ["title", "slug", "description", "category", "media_id", "is_public"],
      slugColumn: "slug",
      slugSource: "title",
      joinClause: "JOIN media m ON m.id = documents.media_id",
      selectExtra: "m.original_name AS file_name, m.mime_type, m.size_bytes",
      onDelete: () => {
        /* file removed from media library, not here */
      },
    }),
    schema: documentSchema,
    columns: [
      { key: "title", label: "Title", type: "text", sortable: true },
      { key: "file_name", label: "File", type: "file" },
      { key: "category", label: "Category", type: "badge" },
      { key: "is_public", label: "Public", type: "boolean" },
    ] satisfies ColumnDef[],
    fields: [
      f("title", "Title", "text", { required: true }),
      slugField(),
      f("description", "Description", "textarea"),
      f("category", "Category", "select", { options: DOC_CATS }),
      f("media_id", "File", "file", { required: true, help: "PDF or office document from the media library." }),
      f("is_public", "Publicly downloadable", "switch"),
    ],
    filters: [{ column: "category", label: "Category", options: DOC_CATS }],
  },

  {
    name: "videos",
    label: "Video",
    plural: "Video Gallery",
    icon: "video",
    permission: "videos.manage",
    description: "Videos shown in the public video gallery.",
    bulkDelete: true,
    service: createCrud({
      table: "videos",
      searchColumns: ["title", "description"],
      filterColumns: ["status", "provider"],
      sortableColumns: ["display_order", "title"],
      defaultSort: { column: "display_order", dir: "asc" },
      writableColumns: ["title", "slug", "description", "provider", "video_url", "embed_url", "thumbnail_url", "display_order", "status"],
      slugColumn: "slug",
      slugSource: "title",
      sanitizeColumns: ["description"],
      transform: (input) => {
        const next = { ...input };
        if (next.provider === "youtube" && typeof next.video_url === "string") {
          next.embed_url = youtubeEmbedUrl(next.video_url);
        }
        return next;
      },
    }),
    schema: videoSchema,
    columns: [
      { key: "title", label: "Video", type: "text", sortable: true },
      { key: "provider", label: "Provider", type: "badge" },
      { key: "display_order", label: "Order", type: "number", sortable: true },
      { key: "status", label: "Status", type: "badge", badgeMap: STATUS_BADGES },
    ] satisfies ColumnDef[],
    fields: [
      f("title", "Title", "text", { required: true }),
      slugField(),
      f("provider", "Provider", "select", { options: PROVIDERS, required: true }),
      f("video_url", "Video URL", "url", { required: true, placeholder: "https://youtube.com/watch?v=…" }),
      f("embed_url", "Embed URL (optional)", "url", { help: "Auto-filled for YouTube links." }),
      f("thumbnail_url", "Thumbnail URL", "url"),
      f("description", "Description", "textarea"),
      f("display_order", "Display order", "number"),
      statusField(),
    ],
    filters: [
      { column: "status", label: "Status", options: STATUS_PUBLISHED },
      { column: "provider", label: "Provider", options: PROVIDERS },
    ],
  },
];

const byName = new Map(RESOURCES.map((r) => [r.name, r]));
export function getResource(name: string): ResourceDefinition | undefined {
  return byName.get(name);
}

export { STATUS_BADGES };
