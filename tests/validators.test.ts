import { describe, it, expect } from "vitest";
import {
  admissionSchema,
  contactSchema,
  loginSchema,
  newsletterSchema,
  resetPasswordSchema,
} from "../src/lib/validators";

describe("validators", () => {
  it("accepts a valid admission application", () => {
    const result = admissionSchema.safeParse({
      studentFirstName: "Emma",
      studentLastName: "Clark",
      dateOfBirth: "2017-04-12",
      gender: "Female",
      gradeApplyingFor: "Grade 3",
      guardianName: "Laura Clark",
      guardianEmail: "laura@example.com",
      guardianPhone: "+1 555 010 1234",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an admission application with a bad email and short name", () => {
    const result = admissionSchema.safeParse({
      studentFirstName: "E",
      studentLastName: "Clark",
      dateOfBirth: "2017-04-12",
      gender: "Female",
      gradeApplyingFor: "Grade 3",
      guardianName: "Laura Clark",
      guardianEmail: "not-an-email",
      guardianPhone: "+1 555 010 1234",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = Object.keys(result.error.flatten().fieldErrors);
      expect(fields).toContain("studentFirstName");
      expect(fields).toContain("guardianEmail");
    }
  });

  it("validates contact messages", () => {
    expect(contactSchema.safeParse({ name: "Jane", email: "jane@example.com", message: "Hello there!" }).success).toBe(true);
    expect(contactSchema.safeParse({ name: "J", email: "bad", message: "short" }).success).toBe(false);
  });

  it("validates newsletter emails", () => {
    expect(newsletterSchema.safeParse({ email: "person@example.com" }).success).toBe(true);
    expect(newsletterSchema.safeParse({ email: "nope" }).success).toBe(false);
  });

  it("enforces password strength on reset", () => {
    expect(resetPasswordSchema.safeParse({ token: "abcdef123456", password: "weak" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: "abcdef123456", password: "Str0ngPass!" }).success).toBe(true);
  });

  it("validates login shape", () => {
    expect(loginSchema.safeParse({ email: "admin@school.edu", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "nope", password: "" }).success).toBe(false);
  });
});
