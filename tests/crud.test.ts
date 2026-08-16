import { describe, it, expect, beforeAll } from "vitest";
import { freshDb } from "./helpers";
import { getResource } from "../src/lib/admin/resources";
import { submitContact, submitAdmission } from "../src/lib/services/forms";
import { listUsers } from "../src/lib/services/users";

describe("content CRUD (news)", () => {
  beforeAll(() => freshDb());

  const news = getResource("news")!.service!;

  it("creates a published news item with an auto-generated slug", () => {
    const item = news.create({ title: "Science Fair Winners", status: "published", category: "Academic" });
    expect(item.id).toBeTruthy();
    expect(item.slug).toBe("science-fair-winners");
  });

  it("ensures slugs are unique", () => {
    const a = news.create({ title: "Sports Day Recap", status: "draft" });
    const b = news.create({ title: "Sports Day Recap", status: "draft" });
    expect(a.slug).toBe("sports-day-recap");
    expect(b.slug).toBe("sports-day-recap-2");
  });

  it("sanitises rich-text content (removes scripts)", () => {
    const item = news.create({
      title: "XSS Test",
      status: "published",
      content: '<p>Hello</p><script>alert("xss")</script><a href="javascript:alert(1)">bad</a>',
    });
    expect(item.content).not.toContain("<script");
    expect(item.content).not.toContain("javascript:");
  });

  it("lists with search, filter and pagination", () => {
    news.create({ title: "Alpha Story", status: "published", category: "Sports" });
    news.create({ title: "Beta Story", status: "draft", category: "Arts" });

    const published = news.list({ filters: { status: "published" } });
    expect(published.items.every((i) => i.status === "published")).toBe(true);

    const search = news.list({ q: "beta" });
    expect(search.total).toBeGreaterThanOrEqual(1);
    expect(search.items.some((i) => i.title === "Beta Story")).toBe(true);

    const paged = news.list({ page: 1, pageSize: 2 });
    expect(paged.items.length).toBeLessThanOrEqual(2);
    expect(paged.totalPages).toBeGreaterThanOrEqual(1);
  });

  it("updates and deletes items", () => {
    const item = news.create({ title: "Temp Story", status: "draft" });
    const updated = news.update(item.id, { title: "Temp Story Updated", status: "published" });
    expect(updated.title).toBe("Temp Story Updated");
    expect(updated.published_at).toBeTruthy();

    news.remove(item.id);
    expect(news.get(item.id)).toBeNull();
  });
});

describe("public forms", () => {
  beforeAll(() => freshDb());

  it("stores a contact message", () => {
    const row = submitContact({ name: "Jane", email: "jane@example.com", subject: "Hi", message: "Hello, please call me." });
    expect(row.id).toBeTruthy();
    expect(row.status).toBe("unread");
  });

  it("stores an admission with a unique application number", () => {
    const a = submitAdmission({
      student_first_name: "Emma", student_last_name: "Clark", date_of_birth: "2017-04-12",
      gender: "Female", grade_applying_for: "Grade 3", guardian_name: "Laura Clark",
      guardian_email: "laura@example.com", guardian_phone: "+1 555 010 1234",
    });
    const b = submitAdmission({
      student_first_name: "Noah", student_last_name: "Haddad", date_of_birth: "2013-09-30",
      gender: "Male", grade_applying_for: "Grade 6", guardian_name: "Omar Haddad",
      guardian_email: "omar@example.com", guardian_phone: "+1 555 010 1235",
    });
    expect(a.application_no).not.toBe(b.application_no);
    expect(a.application_no).toMatch(/^MBA-\d{4}-\d{4}$/);
  });
});

describe("users", () => {
  beforeAll(() => freshDb());

  it("lists users with pagination", () => {
    const result = listUsers({ page: 1, pageSize: 10 });
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.total).toBe(0);
  });
});
