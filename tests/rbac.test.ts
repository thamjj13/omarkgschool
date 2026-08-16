import { describe, it, expect, beforeAll } from "vitest";
import { freshDb, seedUser } from "./helpers";
import { can, permissionsForUser, permissionsForRole } from "../src/lib/auth/rbac";

const user = { id: 1, name: "Test", email: "x", role: "staff", roleName: "Staff" };

describe("role-based access control", () => {
  beforeAll(() => freshDb());

  it("assigns the expected permission sets to roles", async () => {
    const staff = permissionsForRole("staff");
    expect(staff.has("admissions.manage")).toBe(true);
    expect(staff.has("messages.manage")).toBe(true);
    expect(staff.has("content.manage")).toBe(false);

    const editor = permissionsForRole("editor");
    expect(editor.has("content.manage")).toBe(true);
    expect(editor.has("users.manage")).toBe(false);

    const superAdmin = permissionsForRole("super_admin");
    expect(superAdmin.size).toBeGreaterThanOrEqual(13);
  });

  it("grants super_admin every permission regardless of DB rows", async () => {
    const id = await seedUser("super_admin", "sa@test.dev");
    expect(can({ ...user, id, role: "super_admin" }, "users.manage")).toBe(true);
    expect(can({ ...user, id, role: "super_admin" }, "settings.manage")).toBe(true);
  });

  it("checks permissions for a real staff user", async () => {
    const id = await seedUser("staff", "staff@test.dev");
    const perms = permissionsForUser(id);
    expect(perms.has("admissions.manage")).toBe(true);
    expect(perms.has("content.manage")).toBe(false);

    const staffUser = { ...user, id, role: "staff" };
    expect(can(staffUser, "admissions.manage")).toBe(true);
    expect(can(staffUser, "users.manage")).toBe(false);
  });

  it("denies unauthenticated users", () => {
    expect(can(null, "content.manage")).toBe(false);
  });
});
