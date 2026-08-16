import { z } from "zod";

/* ── helpers ─────────────────────────────────────────────────────────────── */

const slug = z
  .string()
  .trim()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may only contain lowercase letters, numbers and hyphens")
  .optional()
  .or(z.literal(""));

const idNumber = z.coerce.number().int().positive().optional().nullable();

const emptyToNull = (s: z.ZodTypeAny) =>
  z.preprocess((v) => (v === "" || v === undefined ? null : v), s);

/** Trims strings and turns ""/undefined into null so empty optionals store as NULL. */
const text = (max = 5000) =>
  z.preprocess(
    (v) => (v === "" || v === undefined ? null : v),
    z.string().trim().max(max).nullable()
  );

/* ── auth ────────────────────────────────────────────────────────────────── */

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72)
    .regex(/[a-zA-Z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const userCreateSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72)
    .regex(/[a-zA-Z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
  role_id: z.coerce.number().int().positive(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  password: z.string().min(8).max(72).optional().or(z.literal("")),
  role_id: z.coerce.number().int().positive().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  current_password: z.string().min(1).optional().or(z.literal("")),
  password: z.string().min(8).max(72).optional().or(z.literal("")),
});

/* ── public forms ────────────────────────────────────────────────────────── */

export const admissionSchema = z.object({
  studentFirstName: z.string().trim().min(2, "First name is required").max(80),
  studentLastName: z.string().trim().min(2, "Last name is required").max(80),
  dateOfBirth: z.string().trim().min(1, "Date of birth is required"),
  gender: z.string().trim().min(1, "Please select a gender"),
  gradeApplyingFor: z.string().trim().min(1, "Please select a grade / class"),
  previousSchool: text(160),
  guardianName: z.string().trim().min(2, "Guardian name is required").max(120),
  guardianRelation: text(80),
  guardianEmail: z.string().trim().toLowerCase().email("Enter a valid email"),
  guardianPhone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[0-9+()\-\s]+$/, "Phone may contain only digits and +()-"),
  address: text(300),
  city: text(100),
  country: text(100),
  message: text(2000),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+()\-\s]*$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  subject: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000),
});

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

/* ── content ─────────────────────────────────────────────────────────────── */

export const newsSchema = z.object({
  title: z.string().trim().min(3, "Title is required").max(300),
  slug,
  excerpt: z.string().trim().max(500).optional().or(z.literal("")),
  content: z.string().max(200000).optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  media_id: idNumber,
  status: z.enum(["draft", "published"]).default("draft"),
  is_featured: z.coerce.boolean().optional().default(false),
  published_at: text(40),
  scheduled_at: text(40),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(3).max(300),
  content: z.string().max(20000).optional().or(z.literal("")),
  type: z.enum(["info", "success", "warning", "urgent"]).default("info"),
  status: z.enum(["draft", "published"]).default("published"),
  priority: z.coerce.number().int().min(0).max(99).default(0),
  starts_at: text(40),
  expires_at: text(40),
});

export const eventSchema = z.object({
  title: z.string().trim().min(3).max(300),
  slug,
  description: z.string().max(100000).optional().or(z.literal("")),
  event_type: z.string().trim().max(80).optional().or(z.literal("")),
  start_date: z.string().trim().min(1, "Start date is required"),
  end_date: text(40),
  start_time: text(10),
  end_time: text(10),
  location: text(200),
  media_id: idNumber,
  status: z.enum(["draft", "published"]).default("published"),
});

export const pageSchema = z.object({
  title: z.string().trim().min(3).max(300),
  slug,
  excerpt: z.string().trim().max(500).optional().or(z.literal("")),
  content: z.string().max(200000).optional().or(z.literal("")),
  meta_title: text(300),
  meta_description: text(500),
  status: z.enum(["draft", "published"]).default("draft"),
});

/* ── academics ───────────────────────────────────────────────────────────── */

export const departmentSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug,
  description: z.string().max(5000).optional().or(z.literal("")),
  icon: z.string().trim().max(60).optional().or(z.literal("")),
  display_order: z.coerce.number().int().default(0),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const programSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug,
  short_description: z.string().trim().max(500).optional().or(z.literal("")),
  description: z.string().max(100000).optional().or(z.literal("")),
  grade_level: text(80),
  duration: text(80),
  capacity: z.coerce.number().int().min(0).default(0),
  curriculum: text(120),
  department_id: idNumber,
  media_id: idNumber,
  display_order: z.coerce.number().int().default(0),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const staffSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug,
  position: text(120),
  department_id: idNumber,
  subject: text(120),
  qualification: text(200),
  bio: z.string().max(20000).optional().or(z.literal("")),
  email: text(160),
  phone: text(40),
  media_id: idNumber,
  display_order: z.coerce.number().int().default(0),
  is_featured: z.coerce.boolean().optional().default(false),
  status: z.enum(["active", "inactive"]).default("active"),
});

/* ── gallery / media / videos ────────────────────────────────────────────── */

export const galleryAlbumSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug,
  description: z.string().max(5000).optional().or(z.literal("")),
  media_id: idNumber,
  display_order: z.coerce.number().int().default(0),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const videoSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug,
  description: z.string().max(5000).optional().or(z.literal("")),
  provider: z.enum(["youtube", "vimeo", "mp4"]).default("youtube"),
  video_url: z.string().trim().min(5, "Video URL is required").max(500),
  embed_url: z.string().trim().max(500).optional().or(z.literal("")),
  thumbnail_url: z.string().trim().max(500).optional().or(z.literal("")),
  display_order: z.coerce.number().int().default(0),
  status: z.enum(["published", "draft"]).default("published"),
});

export const mediaMetadataSchema = z.object({
  alt_text: z.string().trim().max(300).optional().or(z.literal("")),
  caption: z.string().trim().max(500).optional().or(z.literal("")),
  is_public: z.coerce.boolean().optional().default(true),
});

/* ── community ───────────────────────────────────────────────────────────── */

export const testimonialSchema = z.object({
  name: z.string().trim().min(2).max(160),
  role_title: text(160),
  affiliation: text(80),
  quote: z.string().trim().min(10, "Quote is too short").max(2000),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  media_id: idNumber,
  display_order: z.coerce.number().int().default(0),
  status: z.enum(["published", "draft"]).default("published"),
});

export const achievementSchema = z.object({
  title: z.string().trim().min(3).max(300),
  slug,
  description: z.string().max(50000).optional().or(z.literal("")),
  category: text(80),
  student_name: text(160),
  achievement_date: text(40),
  media_id: idNumber,
  status: z.enum(["published", "draft"]).default("published"),
});

export const awardSchema = z.object({
  title: z.string().trim().min(3).max(300),
  description: z.string().max(50000).optional().or(z.literal("")),
  awarder: text(160),
  recipient: text(160),
  award_year: text(10),
  media_id: idNumber,
  status: z.enum(["published", "draft"]).default("published"),
});

export const faqSchema = z.object({
  question: z.string().trim().min(5).max(500),
  answer: z.string().min(5).max(10000),
  category: text(80),
  display_order: z.coerce.number().int().default(0),
  status: z.enum(["published", "draft"]).default("published"),
});

export const documentSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug,
  description: z.string().max(2000).optional().or(z.literal("")),
  category: text(80),
  media_id: z.coerce.number().int().positive("A file is required"),
  is_public: z.coerce.boolean().optional().default(true),
});

export const alumniSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug,
  graduation_year: text(10),
  current_role: text(160),
  employer: text(160),
  program: text(160),
  bio: z.string().max(20000).optional().or(z.literal("")),
  email: text(160),
  linkedin: text(300),
  media_id: idNumber,
  is_featured: z.coerce.boolean().optional().default(false),
  status: z.enum(["published", "draft"]).default("published"),
});

/* ── settings / navigation / homepage ────────────────────────────────────── */

export const navigationItemSchema = z.object({
  label: z.string().trim().min(1).max(120),
  url: z.string().trim().min(1).max(500),
  type: z.enum(["internal", "external"]).default("internal"),
  target: z.enum(["_self", "_blank"]).default("_self"),
  location: z.enum(["header", "footer", "both"]).default("header"),
  parent_id: idNumber,
  display_order: z.coerce.number().int().default(0),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const homepageSectionSchema = z.object({
  key: z.string().trim().min(2).max(60),
  type: z.string().trim().min(2).max(40),
  title: z.string().trim().max(300).optional().or(z.literal("")),
  subtitle: z.string().trim().max(500).optional().or(z.literal("")),
  body: z.string().max(100000).optional().or(z.literal("")),
  media_id: idNumber,
  config: z.record(z.any()).optional().default({}),
  enabled: z.coerce.boolean().default(true),
  display_order: z.coerce.number().int().default(0),
});

export const siteSettingsSchema = z.record(
  z.string().trim().min(1).max(100),
  z.string().max(20000)
);

export type AdmissionInput = z.infer<typeof admissionSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
