"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import { Icon } from "../ui/icon";
import { Spinner, EmptyState } from "../ui/primitives";
import { Button } from "../ui/button";
import { toast } from "../ui/toast";
import { api } from "@/lib/client/api";
import { mediaUrl } from "@/lib/media-url";
import { fileSize } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface MediaRow {
  id: number;
  kind: string;
  original_name: string;
  size_bytes: number;
  mime_type: string;
  alt_text: string;
}

export function MediaPicker({
  open,
  onClose,
  onSelect,
  accept = ["image"],
  currentId,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (id: number | null) => void;
  accept?: ("image" | "pdf" | "video" | "other")[];
  currentId?: number | null;
}) {
  const [items, setItems] = useState<MediaRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const pageSize = 18;

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
    if (open) {
      setPage(1);
      setQ("");
      setKind("all");
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) load();
  }, [page, kind, load, open]);

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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Modal open={open} onClose={onClose} title="Media library" size="xl">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search files…"
            className="w-full rounded-xl border border-ink-200 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-1">
          {["all", "image", "pdf", "video", "other"].map((k) => (
            <button
              key={k}
              onClick={() => {
                setKind(k);
                setPage(1);
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                kind === k ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200"
              )}
            >
              {k}
            </button>
          ))}
        </div>
        <label className="cursor-pointer">
          <input type="file" accept={accept.map((a) => (a === "pdf" ? ".pdf" : a === "image" ? "image/*" : a === "video" ? "video/*" : "*")).join(",")} className="hidden" onChange={upload} />
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700">
            <Icon name="upload" size={14} /> {uploading ? "Uploading…" : "Upload"}
          </span>
        </label>
      </div>

      <div className="mt-4 min-h-[240px]">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="text-brand-600" /></div>
        ) : items.length === 0 ? (
          <EmptyState icon="image" title="No files" description="Upload files to get started." />
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {items.map((m) => {
              const selected = currentId === m.id;
              const isImage = m.kind === "image";
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    onSelect(m.id);
                    onClose();
                  }}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-xl border-2 bg-ink-100",
                    selected ? "border-brand-600" : "border-transparent hover:border-brand-300"
                  )}
                  title={m.original_name}
                >
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`${mediaUrl(m.id)}?thumb=1`} alt={m.alt_text || m.original_name} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-1 p-1 text-ink-500">
                      <Icon name={m.kind === "pdf" ? "file-text" : m.kind === "video" ? "video" : "file-text"} size={22} />
                      <span className="truncate text-[10px]">{m.original_name}</span>
                    </div>
                  )}
                  {selected && (
                    <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                      <Icon name="check" size={12} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-ink-500">
        <span>{total} file{total === 1 ? "" : "s"}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            <Icon name="chevron-left" size={15} /> Prev
          </Button>
          <span className="text-xs">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            Next <Icon name="chevron-right" size={15} />
          </Button>
        </div>
      </div>
      <p className="mt-2 text-xs text-ink-400">Max sizes: images 10 MB · PDFs 20 MB · video 100 MB. {fileSize(10 * 1024 * 1024)}</p>
    </Modal>
  );
}
