"use client";

import { useCallback, useEffect, useState } from "react";
import { api, firstFieldError } from "@/lib/client/api";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { Badge, Spinner, EmptyState } from "../ui/primitives";
import { Modal } from "../ui/modal";
import { Field, Input, Select } from "../ui/forms";
import { toast } from "../ui/toast";

interface NavItem {
  id: number;
  parent_id: number | null;
  label: string;
  url: string;
  type: string;
  target: string;
  location: string;
  display_order: number;
  status: string;
}

export function NavigationManager() {
  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<NavItem | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<NavItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ items: NavItem[] }>("/api/admin/navigation");
      setItems(data.items);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ label: "", url: "", type: "internal", target: "_self", location: "header", parent_id: "", display_order: 0, status: "active" });
    setErrors({});
    setModal(true);
  }
  function openEdit(item: NavItem) {
    setEditing(item);
    setForm({ ...item, parent_id: item.parent_id ?? "" });
    setErrors({});
    setModal(true);
  }

  async function save() {
    setErrors({});
    const payload = { ...form, parent_id: form.parent_id === "" ? null : Number(form.parent_id) };
    try {
      if (editing) {
        await api.patch(`/api/admin/navigation/${editing.id}`, payload);
        toast("Menu item updated");
      } else {
        await api.post("/api/admin/navigation", payload);
        toast("Menu item added");
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
      await api.delete(`/api/admin/navigation/${deleteTarget.id}`);
      toast("Menu item deleted");
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "error");
    }
  }

  const topLevel = items.filter((i) => !i.parent_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">Control the header and footer menus.</p>
        <Button onClick={openCreate}><Icon name="plus" size={16} /> Add item</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="text-brand-600" /></div>
      ) : items.length === 0 ? (
        <EmptyState icon="list" title="No menu items" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60">
                <th className="px-4 py-3 font-semibold text-ink-600">Label</th>
                <th className="px-4 py-3 font-semibold text-ink-600">URL</th>
                <th className="px-4 py-3 font-semibold text-ink-600">Location</th>
                <th className="px-4 py-3 font-semibold text-ink-600">Order</th>
                <th className="px-4 py-3 text-right font-semibold text-ink-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {topLevel.map((item) => (
                <NavRow key={item.id} item={item} items={items} onEdit={openEdit} onDelete={setDeleteTarget} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit menu item" : "Add menu item"} size="md"
        footer={<><Button variant="outline" onClick={() => setModal(false)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <div className="space-y-4">
          <Field label="Label" required error={errors.label}>
            <Input value={form.label ?? ""} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
          </Field>
          <Field label="URL" required error={errors.url} hint="Internal paths like /about or full external URLs.">
            <Input value={form.url ?? ""} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <Select value={form.type ?? "internal"} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="internal">Internal</option>
                <option value="external">External</option>
              </Select>
            </Field>
            <Field label="Location">
              <Select value={form.location ?? "header"} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}>
                <option value="header">Header</option>
                <option value="footer">Footer</option>
                <option value="both">Both</option>
              </Select>
            </Field>
            <Field label="Parent item">
              <Select value={form.parent_id ?? ""} onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}>
                <option value="">— None (top level) —</option>
                {items.filter((i) => i.id !== editing?.id && !i.parent_id).map((i) => (
                  <option key={i.id} value={i.id}>{i.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Display order">
              <Input type="number" value={form.display_order ?? 0} onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))} />
            </Field>
          </div>
          <Field label="Status">
            <Select value={form.status ?? "active"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
        </div>
      </Modal>

      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete menu item" size="sm">
        <p className="text-sm text-ink-600">Delete <strong>{deleteTarget?.label}</strong>?</p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={remove}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

function NavRow({ item, items, onEdit, onDelete }: { item: NavItem; items: NavItem[]; onEdit: (i: NavItem) => void; onDelete: (i: NavItem) => void }) {
  const children = items.filter((i) => i.parent_id === item.id);
  return (
    <>
      <tr className="hover:bg-ink-50/50">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink-900">{item.label}</span>
            {item.type === "external" && <Icon name="external-link" size={13} className="text-ink-300" />}
          </div>
        </td>
        <td className="px-4 py-3 text-ink-500">{item.url}</td>
        <td className="px-4 py-3"><Badge tone="slate">{item.location}</Badge></td>
        <td className="px-4 py-3 text-ink-500">{item.display_order}</td>
        <td className="px-4 py-3">
          <div className="flex justify-end gap-1">
            <button onClick={() => onEdit(item)} className="rounded-lg p-2 text-ink-500 hover:bg-brand-50 hover:text-brand-700" aria-label="Edit"><Icon name="pencil" size={16} /></button>
            <button onClick={() => onDelete(item)} className="rounded-lg p-2 text-ink-500 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete"><Icon name="trash" size={16} /></button>
          </div>
        </td>
      </tr>
      {children.map((c) => (
        <tr key={c.id} className="bg-ink-50/40 hover:bg-ink-50">
          <td className="px-4 py-2.5 pl-10">
            <span className="flex items-center gap-1.5 text-ink-700">
              <Icon name="chevron-right" size={13} className="text-ink-300" /> {c.label}
            </span>
          </td>
          <td className="px-4 py-2.5 text-ink-500">{c.url}</td>
          <td className="px-4 py-2.5"><Badge tone="slate">{c.location}</Badge></td>
          <td className="px-4 py-2.5 text-ink-500">{c.display_order}</td>
          <td className="px-4 py-2.5">
            <div className="flex justify-end gap-1">
              <button onClick={() => onEdit(c)} className="rounded-lg p-2 text-ink-500 hover:bg-brand-50 hover:text-brand-700" aria-label="Edit"><Icon name="pencil" size={15} /></button>
              <button onClick={() => onDelete(c)} className="rounded-lg p-2 text-ink-500 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete"><Icon name="trash" size={15} /></button>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}
