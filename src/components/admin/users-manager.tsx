"use client";

import { useCallback, useEffect, useState } from "react";
import { api, firstFieldError } from "@/lib/client/api";
import { formatDate, initials, avatarColor } from "@/lib/utils";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { Badge, Spinner, EmptyState } from "../ui/primitives";
import { Modal } from "../ui/modal";
import { Field, Input, Select } from "../ui/forms";
import { toast } from "../ui/toast";

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  roleName: string;
  role_id: number;
  status: string;
  last_login_at: string | null;
}
interface Role {
  id: number;
  slug: string;
  name: string;
}

export function UsersManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role_id: 0, status: "active" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (q) params.set("q", q);
      const [usersData, rolesData] = await Promise.all([
        api.get<{ items: UserRow[]; total: number }>(`/api/admin/users?${params}`),
        api.get<{ roles: Role[] }>("/api/admin/roles"),
      ]);
      setUsers(usersData.items);
      setTotal(usersData.total);
      setRoles(rolesData.roles);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }, [page, q]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", email: "", password: "", role_id: roles[0]?.id ?? 0, status: "active" });
    setErrors({});
    setModal(true);
  }
  function openEdit(u: UserRow) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: "", role_id: u.role_id, status: u.status });
    setErrors({});
    setModal(true);
  }

  async function save() {
    setErrors({});
    try {
      if (editing) {
        const payload: any = { name: form.name, email: form.email, role_id: form.role_id, status: form.status };
        if (form.password) payload.password = form.password;
        await api.patch(`/api/admin/users/${editing.id}`, payload);
        toast("User updated");
      } else {
        await api.post("/api/admin/users", form);
        toast("User created");
      }
      setModal(false);
      load();
    } catch (e) {
      if (e instanceof Error && (e as any).fields) {
        const f = (e as any).fields as Record<string, string[]>;
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(f)) flat[k] = v[0];
        setErrors(flat);
      } else {
        toast(firstFieldError(e) ?? "Failed to save", "error");
      }
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/admin/users/${deleteTarget.id}`);
      toast("User deleted");
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to delete", "error");
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search users…" className="w-64 rounded-xl border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none" />
        </div>
        <Button onClick={openCreate}><Icon name="plus" size={16} /> New user</Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60">
              <th className="px-4 py-3 font-semibold text-ink-600">User</th>
              <th className="px-4 py-3 font-semibold text-ink-600">Role</th>
              <th className="px-4 py-3 font-semibold text-ink-600">Status</th>
              <th className="px-4 py-3 font-semibold text-ink-600">Last login</th>
              <th className="px-4 py-3 text-right font-semibold text-ink-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center"><Spinner className="text-brand-600" /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5}><EmptyState icon="shield" title="No users found" /></td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-ink-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${avatarColor(u.name)}`}>{initials(u.name)}</span>
                      <div>
                        <p className="font-medium text-ink-900">{u.name}</p>
                        <p className="text-xs text-ink-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge tone={u.role === "super_admin" ? "violet" : u.role === "editor" ? "sky" : "emerald"}>{u.roleName}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={u.status === "active" ? "emerald" : "slate"}>{u.status}</Badge></td>
                  <td className="px-4 py-3 text-ink-500">{formatDate(u.last_login_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(u)} className="rounded-lg p-2 text-ink-500 hover:bg-brand-50 hover:text-brand-700" aria-label="Edit"><Icon name="pencil" size={16} /></button>
                      <button onClick={() => setDeleteTarget(u)} className="rounded-lg p-2 text-ink-500 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete"><Icon name="trash" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit user" : "New user"} size="md"
        footer={<><Button variant="outline" onClick={() => setModal(false)}>Cancel</Button><Button onClick={save}>{editing ? "Save" : "Create"}</Button></>}>
        <div className="space-y-4">
          <Field label="Name" required error={errors.name}>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Email" required error={errors.email}>
            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </Field>
          <Field label={editing ? "New password (leave blank to keep)" : "Password"} required={!editing} error={errors.password} hint="Minimum 8 characters with a letter and a number.">
            <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          </Field>
          <Field label="Role" required>
            <Select value={form.role_id} onChange={(e) => setForm((f) => ({ ...f, role_id: Number(e.target.value) }))}>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
        </div>
      </Modal>

      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete user" size="sm">
        <p className="text-sm text-ink-600">Delete <strong>{deleteTarget?.email}</strong>? This cannot be undone.</p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={remove}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
