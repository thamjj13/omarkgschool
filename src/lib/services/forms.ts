import { getDb } from "../db/client";
import { clampInt, nowIso } from "../utils";
import { ApiError } from "../api/errors";

/* ── admissions ─────────────────────────────────────────────────────────── */

export interface AdmissionRow {
  id: number;
  application_no: string;
  student_first_name: string;
  student_last_name: string;
  date_of_birth: string;
  gender: string;
  grade_applying_for: string;
  previous_school: string;
  guardian_name: string;
  guardian_relation: string;
  guardian_email: string;
  guardian_phone: string;
  address: string;
  city: string;
  country: string;
  message: string;
  status: string;
  review_notes: string;
  submitted_at: string;
}

export function submitAdmission(input: Record<string, string>): AdmissionRow {
  const db = getDb();
  const year = new Date().getFullYear();
  const seq = db.prepare(
    `SELECT COUNT(*) AS n FROM admissions WHERE application_no LIKE ?`
  ).get(`MBA-${year}-%`) as { n: number };
  const applicationNo = `MBA-${year}-${String(seq.n + 1).padStart(4, "0")}`;

  const result = db
    .prepare(
      `INSERT INTO admissions (
         application_no, student_first_name, student_last_name, date_of_birth, gender,
         grade_applying_for, previous_school, guardian_name, guardian_relation,
         guardian_email, guardian_phone, address, city, country, message
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      applicationNo,
      input.student_first_name,
      input.student_last_name,
      input.date_of_birth,
      input.gender,
      input.grade_applying_for,
      input.previous_school ?? "",
      input.guardian_name,
      input.guardian_relation ?? "",
      input.guardian_email,
      input.guardian_phone,
      input.address ?? "",
      input.city ?? "",
      input.country ?? "",
      input.message ?? ""
    );
  return db
    .prepare("SELECT * FROM admissions WHERE id = ?")
    .get(Number(result.lastInsertRowid)) as AdmissionRow;
}

export function listAdmissions(query: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
}) {
  const db = getDb();
  const page = clampInt(query.page, 1, 100000, 1);
  const pageSize = clampInt(query.pageSize, 1, 100, 20);

  const clauses: string[] = [];
  const params: unknown[] = [];
  if (query.q) {
    clauses.push(
      "(application_no LIKE ? OR student_first_name LIKE ? OR student_last_name LIKE ? OR guardian_name LIKE ? OR guardian_email LIKE ?)"
    );
    const like = `%${query.q}%`;
    params.push(like, like, like, like, like);
  }
  if (query.status && query.status !== "all") {
    clauses.push("status = ?");
    params.push(query.status);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const total = (db.prepare(`SELECT COUNT(*) AS n FROM admissions ${where}`).get(...params) as { n: number }).n;
  const items = db
    .prepare(`SELECT * FROM admissions ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, (page - 1) * pageSize) as AdmissionRow[];

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function getAdmission(id: number): AdmissionRow | undefined {
  return getDb().prepare("SELECT * FROM admissions WHERE id = ?").get(id) as AdmissionRow | undefined;
}

export function setAdmissionStatus(
  id: number,
  status: string,
  reviewNotes: string,
  reviewerId: number
): AdmissionRow {
  const db = getDb();
  const row = getAdmission(id);
  if (!row) throw new ApiError(404, "Application not found", "NOT_FOUND");
  db.prepare(
    `UPDATE admissions SET status = ?, review_notes = ?, reviewed_by = ?, updated_at = ? WHERE id = ?`
  ).run(status, reviewNotes, reviewerId, nowIso(), id);
  return getAdmission(id)!;
}

export function deleteAdmission(id: number): void {
  getDb().prepare("DELETE FROM admissions WHERE id = ?").run(id);
}

/* ── contact messages ───────────────────────────────────────────────────── */

export interface ContactRow {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  is_newsletter: number;
  created_at: string;
}

export function submitContact(input: Record<string, string>): ContactRow {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      input.name,
      input.email,
      input.phone ?? "",
      input.subject ?? "",
      input.message
    );
  return db
    .prepare("SELECT * FROM contact_messages WHERE id = ?")
    .get(Number(result.lastInsertRowid)) as ContactRow;
}

export function listContactMessages(query: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
}) {
  const db = getDb();
  const page = clampInt(query.page, 1, 100000, 1);
  const pageSize = clampInt(query.pageSize, 1, 100, 20);

  const clauses: string[] = [];
  const params: unknown[] = [];
  if (query.q) {
    clauses.push("(name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)");
    const like = `%${query.q}%`;
    params.push(like, like, like, like);
  }
  if (query.status && query.status !== "all") {
    clauses.push("status = ?");
    params.push(query.status);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const total = (db.prepare(`SELECT COUNT(*) AS n FROM contact_messages ${where}`).get(...params) as { n: number }).n;
  const items = db
    .prepare(`SELECT * FROM contact_messages ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, (page - 1) * pageSize) as ContactRow[];

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function updateContactStatus(id: number, status: string): ContactRow {
  const db = getDb();
  db.prepare("UPDATE contact_messages SET status = ?, updated_at = ? WHERE id = ?").run(
    status,
    nowIso(),
    id
  );
  return db.prepare("SELECT * FROM contact_messages WHERE id = ?").get(id) as ContactRow;
}

export function deleteContact(id: number): void {
  getDb().prepare("DELETE FROM contact_messages WHERE id = ?").run(id);
}

/* ── newsletter ─────────────────────────────────────────────────────────── */

export function subscribeNewsletter(email: string): { created: boolean } {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM newsletter_subscribers WHERE email = ?")
    .get(email) as { id: number; status: string } | undefined;
  if (existing) {
    if (existing.status === "subscribed") return { created: false };
    db.prepare("UPDATE newsletter_subscribers SET status = 'subscribed' WHERE id = ?").run(existing.id);
    return { created: false };
  }
  db.prepare("INSERT INTO newsletter_subscribers (email) VALUES (?)").run(email);
  return { created: true };
}

export function listSubscribers(query: { page?: number; pageSize?: number; q?: string }) {
  const db = getDb();
  const page = clampInt(query.page, 1, 100000, 1);
  const pageSize = clampInt(query.pageSize, 1, 100, 25);
  const where = query.q ? "WHERE email LIKE ?" : "";
  const params = query.q ? [`%${query.q}%`] : [];
  const total = (db.prepare(`SELECT COUNT(*) AS n FROM newsletter_subscribers ${where}`).get(...params) as { n: number }).n;
  const items = db
    .prepare(`SELECT * FROM newsletter_subscribers ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, (page - 1) * pageSize);
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function setSubscriberStatus(id: number, status: string): void {
  getDb().prepare("UPDATE newsletter_subscribers SET status = ? WHERE id = ?").run(status, id);
}
