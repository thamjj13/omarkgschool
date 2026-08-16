"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { cn, fileSize } from "@/lib/utils";
import { mediaUrl } from "@/lib/media-url";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { Spinner, EmptyState, Badge } from "../ui/primitives";
import { Modal } from "../ui/modal";
import { Field, Input, Textarea, Switch } from "../ui/forms";
import { toast } from "../ui/toast";

interface MediaRow {
  id: number;
  kind: string;
  original_name: string;
  size_bytes: number;
  mime_type: string;
  alt_text: string;
  caption: string;
  is_public: number;
  created_at: string;
}

export function MediaLibrary() {
  const [items, setItems] = useState<MediaRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<MediaRow | null>(null);
  const [form, setForm] = useState({ alt_text: "", caption: "", is_public: true });
  const [deleteTarget, setDeleteTarget] = useState<MediaRow | null>(null);
  const pageSize = 24;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (q) params.set("q", q);
      if (kind !== "all") params.set("kind", kind);
      const data = await api.get<{ items: MediaRow[]; total: number }>(`/api/admin/media?${params}`);
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to load media", "error");
    } finally {
      setLoading(false);
    }
  }, [page, q, kind]);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.upload("/api/admin/media", fd);
      toast("File uploaded");
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function openEdit(m: MediaRow) {
    setEditing(m);
    setForm({ alt_text: m.alt_text, caption: m.caption, is_public: !!m.is_public });
  }

  async function save() {
    if (!editing) return;
    try {
      await api.patch(`/api/admin/media/${editing.id}`, { ...form, is_public: form.is_public ? 1 : 0 });
      toast("Media updated");
      setEditing(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to update", "error");
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/admin/media/${deleteTarget.id}`);
      toast("File deleted");
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to delete", "error");
      setDeleteTarget(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search files…" className="w-64 rounded-xl border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none" />
          </div>
          <div className="flex gap-1">
            {["all", "image", "pdf", "video", "other"].map((k) => (
              <button key={k} onClick={() => { setKind(k); setPage(1); }} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium capitalize", kind === k ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200")}>{k}</button>
            ))}
          </div>
        </div>
        <label className="cursor-pointer">
          <input type="file" className="hidden" onChange={upload} />
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
            <Icon name="upload" size={16} /> {uploading ? "Uploading…" : "Upload file"}
          </span>
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="text-brand-600" /></div>
      ) : items.length === 0 ? (
        <EmptyState icon="image" title="No media files" description="Upload images, PDFs or videos to the library." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((m) => (
            <div key={m.id} className="group overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
              <div className="relative aspect-square bg-ink-100">
                {m.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${mediaUrl(m.id)}?thumb=1`} alt={m.alt_text} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-1 text-ink-400">
                    <Icon name={m.kind === "pdf" ? "file-text" : m.kind === "video" ? "video" : "file-text"} size={26} />
                    <span className="px-2 text-center text-[10px] leading-tight">{m.original_name}</span>
                  </div>
                )}
                <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => openEdit(m)} className="rounded-lg bg-white p-1.5 text-ink-600 shadow hover:text-brand-700" aria-label="Edit">
                    <Icon name="pencil" size={13} />
                  </button>
                  <button onClick={() => setDeleteTarget(m)} className="rounded-lg bg-white p-1.5 text-ink-600 shadow hover:text-rose-600" aria-label="Delete">
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              </div>
              <div className="p-2.5">
                <p className="truncate text-xs font-medium text-ink-800">{m.original_name}</p>
                <p className="text-[11px] text-ink-400">{fileSize(m.size_bytes)} · {m.kind}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-500">{total} files</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
            <span className="text-xs">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
          </div>
        </div>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit media" size="md"
        footer={<><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {editing && (
          <div className="space-y-4">
            {editing.kind === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(editing.id)} alt="" className="mx-auto max-h-52 rounded-xl object-contain" />
            )}
            <div className="flex items-center gap-2">
              <Badge tone="brand">{editing.kind}</Badge>
              <span className="truncate text-sm text-ink-500">{editing.original_name} · {fileSize(editing.size_bytes)}</span>
            </div>
            <Field label="Alt text" hint="Describes the image for screen readers and SEO.">
              <Input value={form.alt_text} onChange={(e) => setForm((f) => ({ ...f, alt_text: e.target.value }))} />
            </Field>
            <Field label="Caption">
              <Textarea value={form.caption} onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))} />
            </Field>
            <Field label="Publicly accessible" hint="Turn off to restrict this file to signed-in admins only.">
              <Switch checked={form.is_public} onChange={(v) => setForm((f) => ({ ...f, is_public: v }))} />
            </Field>
          </div>
        )}
      </Modal>

      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete file" size="sm">
        <p className="text-sm text-ink-600">Delete <strong>{deleteTarget?.original_name}</strong> permanently? This cannot be undone.</p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={remove}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
