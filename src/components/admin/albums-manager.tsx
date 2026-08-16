"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { cn } from "@/lib/utils";
import { mediaUrl } from "@/lib/media-url";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { Badge, Spinner, EmptyState } from "../ui/primitives";
import { Modal } from "../ui/modal";
import { Field, Input, Textarea, Select } from "../ui/forms";
import { toast } from "../ui/toast";

interface Album {
  id: number;
  title: string;
  slug: string;
  description: string;
  media_id: number | null;
  status: string;
}
interface MediaRow {
  id: number;
  kind: string;
  original_name: string;
  alt_text: string;
}

export function AlbumsManager() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Album | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", description: "", status: "active" });
  const [deleteTarget, setDeleteTarget] = useState<Album | null>(null);
  const [manage, setManage] = useState<Album | null>(null);
  const [allMedia, setAllMedia] = useState<MediaRow[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [savingMedia, setSavingMedia] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ items: Album[] }>("/api/admin/albums");
      setAlbums(data.items);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to load albums", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ title: "", slug: "", description: "", status: "active" });
    setModal(true);
  }
  function openEdit(a: Album) {
    setEditing(a);
    setForm({ title: a.title, slug: a.slug, description: a.description, status: a.status });
    setModal(true);
  }

  async function save() {
    try {
      if (editing) {
        await api.patch(`/api/admin/albums/${editing.id}`, form);
        toast("Album updated");
      } else {
        await api.post("/api/admin/albums", form);
        toast("Album created");
      }
      setModal(false);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to save", "error");
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/admin/albums/${deleteTarget.id}`);
      toast("Album deleted");
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to delete", "error");
    }
  }

  async function openManage(a: Album) {
    setManage(a);
    setSelected([]);
    try {
      const [detail, lib] = await Promise.all([
        api.get<{ media: { id: number }[] }>(`/api/admin/albums/${a.id}`),
        api.get<{ items: MediaRow[] }>("/api/admin/media?pageSize=100&kind=image"),
      ]);
      setSelected(detail.media.map((m) => m.id));
      setAllMedia(lib.items);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to load photos", "error");
    }
  }

  async function saveMedia() {
    if (!manage) return;
    setSavingMedia(true);
    try {
      await api.put(`/api/admin/albums/${manage.id}/media`, { mediaIds: selected });
      toast("Album photos saved");
      setManage(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to save", "error");
    } finally {
      setSavingMedia(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="text-brand-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">Organise photos into public gallery albums.</p>
        <Button onClick={openCreate}><Icon name="plus" size={16} /> New album</Button>
      </div>

      {albums.length === 0 ? (
        <EmptyState icon="grid" title="No albums yet" description="Create your first gallery album." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <div key={a.id} className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
              <div className="aspect-[16/10] bg-ink-100">
                {a.media_id ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${mediaUrl(a.media_id)}?thumb=1`} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-ink-300"><Icon name="image" size={32} /></div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-display text-base font-semibold text-ink-950">{a.title}</h3>
                  <Badge tone={a.status === "active" ? "emerald" : "slate"}>{a.status}</Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openManage(a)}><Icon name="image" size={14} /> Photos</Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(a)}><Icon name="pencil" size={14} /></Button>
                  <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setDeleteTarget(a)}><Icon name="trash" size={14} /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit album" : "New album"} size="md"
        footer={<><Button variant="outline" onClick={() => setModal(false)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <div className="space-y-4">
          <Field label="Title" required>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </Field>
          <Field label="Slug" hint="Leave blank to auto-generate.">
            <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
          </Field>
          <Field label="Description">
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
        </div>
      </Modal>

      <Modal open={manage !== null} onClose={() => setManage(null)} title={`Photos in “${manage?.title}”`} size="xl"
        footer={<><Button variant="outline" onClick={() => setManage(null)}>Cancel</Button><Button onClick={saveMedia} loading={savingMedia}>Save photos</Button></>}>
        <p className="mb-3 text-sm text-ink-500">Click photos to add or remove them from this album.</p>
        <div className="grid max-h-[50vh] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5 md:grid-cols-6">
          {allMedia.map((m) => {
            const on = selected.includes(m.id);
            return (
              <button key={m.id} onClick={() => setSelected((s) => (on ? s.filter((x) => x !== m.id) : [...s, m.id]))}
                className={cn("relative aspect-square overflow-hidden rounded-xl border-2", on ? "border-brand-600" : "border-transparent opacity-80 hover:opacity-100")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${mediaUrl(m.id)}?thumb=1`} alt={m.alt_text} loading="lazy" className="h-full w-full object-cover" />
                {on && <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white"><Icon name="check" size={12} strokeWidth={3} /></span>}
              </button>
            );
          })}
        </div>
      </Modal>

      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete album" size="sm">
        <p className="text-sm text-ink-600">Delete <strong>{deleteTarget?.title}</strong>? Photos stay in the media library.</p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={remove}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
