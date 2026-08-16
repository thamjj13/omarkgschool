"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, firstFieldError } from "@/lib/client/api";
import { cn, formatDate, stripHtml, fileSize } from "@/lib/utils";
import { mediaUrl } from "@/lib/media-url";
import { Icon, type IconName } from "../ui/icon";
import { Button } from "../ui/button";
import { Badge, Spinner, EmptyState } from "../ui/primitives";
import { Modal } from "../ui/modal";
import { Input, Textarea, Select, Switch, Field } from "../ui/forms";
import { toast } from "../ui/toast";
import { RichTextEditor } from "./rich-text-editor";
import { MediaPicker } from "./media-picker";
import type { ColumnDef, FieldDef } from "@/lib/admin/types";

interface Meta {
  name: string;
  label: string;
  plural: string;
  icon: IconName;
  columns: ColumnDef[];
  fields: FieldDef[];
  filters?: { column: string; label: string; options: { value: string; label: string }[] }[];
  bulkDelete?: boolean;
  description?: string;
}

interface ListResponse {
  items: Record<string, any>[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function ResourceManager({ resource }: { resource: string }) {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [data, setData] = useState<ListResponse | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<string | undefined>();
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<number[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Record<string, any> | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── data loading ─────────────────────────────────────────────────────── */

  const loadMeta = useCallback(async () => {
    const m = await api.get<Meta>(`/api/admin/meta/${resource}`);
    setMeta(m);
    return m;
  }, [resource]);

  const loadList = useCallback(
    async (m: Meta | null, pageNum: number, query: string, sortCol?: string, dirVal?: "asc" | "desc", filterMap?: Record<string, string>) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(pageNum), pageSize: "20" });
        if (query) params.set("q", query);
        if (sortCol) {
          params.set("sort", sortCol);
          params.set("dir", dirVal ?? "desc");
        }
        for (const col of m?.filters?.map((f) => f.column) ?? []) {
          const v = filterMap?.[col];
          if (v && v !== "all") params.set(col, v);
        }
        const res = await api.get<ListResponse>(`/api/admin/resources/${resource}?${params}`);
        setData(res);
        setSelection([]);
      } catch (e) {
        toast(e instanceof Error ? e.message : "Failed to load data", "error");
      } finally {
        setLoading(false);
      }
    },
    [resource]
  );

  useEffect(() => {
    loadMeta().then((m) => loadList(m, 1, "", undefined, "desc", {}));
  }, [loadMeta, loadList]);

  function refresh() {
    loadList(meta, page, q, sort, dir, filters);
  }

  function onSearch(value: string) {
    setQ(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      setPage(1);
      loadList(meta, 1, value, sort, dir, filters);
    }, 350);
  }

  function changeFilter(col: string, value: string) {
    const next = { ...filters, [col]: value };
    setFilters(next);
    setPage(1);
    loadList(meta, 1, q, sort, dir, next);
  }

  function changeSort(col: string) {
    const nextDir = sort === col && dir === "desc" ? "asc" : sort === col && dir === "asc" ? "desc" : "desc";
    setSort(col);
    setDir(nextDir);
    loadList(meta, page, q, col, nextDir, filters);
  }

  /* ── form handling ────────────────────────────────────────────────────── */

  function defaultForm(): Record<string, any> {
    const f: Record<string, any> = {};
    for (const field of meta?.fields ?? []) {
      if (field.type === "switch") f[field.name] = false;
      else if (field.type === "number") f[field.name] = field.min ?? 0;
      else if (field.type === "select") f[field.name] = field.options?.[0]?.value ?? "";
      else f[field.name] = "";
    }
    return f;
  }

  function openCreate() {
    setEditing(null);
    setForm(defaultForm());
    setFormErrors({});
    setModalOpen(true);
  }

  function openEdit(row: Record<string, any>) {
    const f: Record<string, any> = {};
    for (const field of meta?.fields ?? []) {
      const v = row[field.name];
      if (field.type === "switch") f[field.name] = !!v;
      else if (field.type === "image" || field.type === "file") f[field.name] = v ?? null;
      else f[field.name] = v ?? "";
    }
    setEditing(row);
    setForm(f);
    setFormErrors({});
    setModalOpen(true);
  }

  async function save() {
    if (!meta) return;
    setSaving(true);
    setFormErrors({});
    try {
      if (editing) {
        await api.patch(`/api/admin/resources/${resource}/${editing.id}`, form);
        toast(`${meta.label} updated`);
      } else {
        await api.post(`/api/admin/resources/${resource}`, form);
        toast(`${meta.label} created`);
      }
      setModalOpen(false);
      refresh();
    } catch (e) {
      if (e instanceof Error && "fields" in (e as any) && (e as any).fields) {
        const fields = (e as any).fields as Record<string, string[]>;
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(fields)) flat[k] = v[0];
        setFormErrors(flat);
      } else {
        toast(firstFieldError(e) ?? "Failed to save", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || !meta) return;
    try {
      await api.delete(`/api/admin/resources/${resource}/${deleteTarget.id}`);
      toast(`${meta.label} deleted`);
      setDeleteTarget(null);
      refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to delete", "error");
    }
  }

  async function confirmBulk() {
    if (!meta) return;
    try {
      await api.post(`/api/admin/resources/${resource}/bulk`, { ids: selection });
      toast(`${selection.length} item${selection.length === 1 ? "" : "s"} deleted`);
      setBulkConfirm(false);
      setSelection([]);
      refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to delete", "error");
      setBulkConfirm(false);
    }
  }

  function toggleSelect(id: number) {
    setSelection((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function toggleSelectAll() {
    const ids = data?.items.map((i) => i.id) ?? [];
    setSelection((s) => (s.length === ids.length ? [] : ids));
  }

  if (!meta) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink-950">{meta.plural}</h2>
          {meta.description && <p className="text-sm text-ink-500">{meta.description}</p>}
        </div>
        <Button onClick={openCreate}>
          <Icon name="plus" size={16} /> New {meta.label}
        </Button>
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={`Search ${meta.plural.toLowerCase()}…`}
            className="w-full rounded-xl border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
          />
        </div>
        {meta.filters?.map((f) => (
          <Select
            key={f.column}
            value={filters[f.column] ?? "all"}
            onChange={(e) => changeFilter(f.column, e.target.value)}
            className="w-auto min-w-[140px]"
            aria-label={f.label}
          >
            <option value="all">All {f.label.toLowerCase()}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        ))}
        {selection.length > 0 && (
          <Button variant="danger" size="sm" onClick={() => setBulkConfirm(true)}>
            <Icon name="trash" size={15} /> Delete {selection.length}
          </Button>
        )}
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60">
                {meta.bulkDelete && (
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={!!(data && data.items.length > 0 && selection.length === data.items.length)}
                      onChange={toggleSelectAll}
                      aria-label="Select all"
                      className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                    />
                  </th>
                )}
                {meta.columns.map((c) => (
                  <th key={c.key} className="px-4 py-3 font-semibold text-ink-600">
                    {c.sortable ? (
                      <button onClick={() => changeSort(c.key)} className="inline-flex items-center gap-1 hover:text-brand-700">
                        {c.label}
                        {sort === c.key && <Icon name={dir === "asc" ? "chevron-up" : "chevron-down"} size={13} />}
                      </button>
                    ) : (
                      c.label
                    )}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-semibold text-ink-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading ? (
                <tr>
                  <td colSpan={meta.columns.length + (meta.bulkDelete ? 2 : 1)} className="px-4 py-10 text-center">
                    <Spinner className="text-brand-600" />
                  </td>
                </tr>
              ) : (data?.items.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={meta.columns.length + (meta.bulkDelete ? 2 : 1)}>
                    <div className="px-4 py-10">
                      <EmptyState icon={meta.icon} title={`No ${meta.plural.toLowerCase()} yet`} description={q ? "No results match your search." : `Click “New ${meta.label}” to get started.`} />
                    </div>
                  </td>
                </tr>
              ) : (
                data!.items.map((row) => (
                  <tr key={row.id} className="hover:bg-ink-50/50">
                    {meta.bulkDelete && (
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selection.includes(row.id)}
                          onChange={() => toggleSelect(row.id)}
                          aria-label={`Select row ${row.id}`}
                          className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                        />
                      </td>
                    )}
                    {meta.columns.map((c) => (
                      <td key={c.key} className="px-4 py-3 align-middle">
                        <Cell column={c} value={row[c.key]} row={row} />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(row)} className="rounded-lg p-2 text-ink-500 hover:bg-brand-50 hover:text-brand-700" aria-label="Edit">
                          <Icon name="pencil" size={16} />
                        </button>
                        <button onClick={() => setDeleteTarget(row)} className="rounded-lg p-2 text-ink-500 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete">
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3 text-sm">
            <span className="text-ink-500">{data.total} total</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { setPage((p) => Math.max(1, p - 1)); loadList(meta, page - 1, q, sort, dir, filters); }} disabled={page <= 1}>
                Prev
              </Button>
              <span className="text-xs text-ink-500">{page} / {data.totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => { setPage((p) => Math.min(data.totalPages, p + 1)); loadList(meta, page + 1, q, sort, dir, filters); }} disabled={page >= data.totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* create/edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${editing ? "Edit" : "New"} ${meta.label}`}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? "Save changes" : "Create"}</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {meta.fields.map((field) => (
            <FormField
              key={field.name}
              field={field}
              value={form[field.name]}
              error={formErrors[field.name]}
              onChange={(v) => {
                setForm((f) => ({ ...f, [field.name]: v }));
                setFormErrors((e) => ({ ...e, [field.name]: "" }));
              }}
              onPick={() => setPickerFor(field.name)}
            />
          ))}
        </div>
      </Modal>

      {/* media picker */}
      <MediaPicker
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        currentId={pickerFor ? form[pickerFor] : null}
        accept={pickerFor && meta.fields.find((f) => f.name === pickerFor)?.type === "file" ? ["pdf", "other"] : ["image"]}
        onSelect={(id) => {
          if (pickerFor) setForm((f) => ({ ...f, [pickerFor]: id }));
          setPickerFor(null);
        }}
      />

      {/* delete confirm */}
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete item" size="sm">
        <p className="text-sm text-ink-600">
          Are you sure you want to delete <strong>“{titleOf(deleteTarget)}”</strong>? This action cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>

      {/* bulk delete confirm */}
      <Modal open={bulkConfirm} onClose={() => setBulkConfirm(false)} title="Delete selected items" size="sm">
        <p className="text-sm text-ink-600">
          Are you sure you want to delete {selection.length} selected item{selection.length === 1 ? "" : "s"}? This action cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setBulkConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmBulk}>Delete all</Button>
        </div>
      </Modal>
    </div>
  );
}

function titleOf(row: Record<string, any> | null): string {
  if (!row) return "";
  return String(row.title ?? row.name ?? row.question ?? row.label ?? "");
}

/* ── table cell ────────────────────────────────────────────────────────── */

function Cell({ column, value, row }: { column: ColumnDef; value: any; row: Record<string, any> }) {
  switch (column.type) {
    case "image":
      return value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`${mediaUrl(value)}?thumb=1`} alt="" className="h-11 w-11 rounded-lg object-cover" />
      ) : (
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink-100 text-ink-300">
          <Icon name="image" size={16} />
        </span>
      );
    case "date":
      return <span className="text-ink-500">{formatDate(value)}</span>;
    case "badge":
      return value ? <Badge className={column.badgeMap?.[value] ?? "bg-ink-100 text-ink-700"}>{value}</Badge> : <span className="text-ink-300">—</span>;
    case "boolean":
      return value ? (
        <Icon name="check" size={16} className="text-emerald-600" />
      ) : (
        <Icon name="x" size={16} className="text-ink-300" />
      );
    case "number":
      return <span className="font-medium text-ink-900">{value}</span>;
    case "richtext":
      return <span className="line-clamp-1 max-w-[220px] text-ink-500">{stripHtml(value ?? "") || "—"}</span>;
    case "file":
      return value ? (
        <span className="inline-flex items-center gap-1.5 text-ink-600">
          <Icon name="file-text" size={15} className="text-rose-500" /> {value}
        </span>
      ) : (
        <span className="text-ink-300">—</span>
      );
    default:
      return <span className="line-clamp-1 font-medium text-ink-800">{value || "—"}</span>;
  }
}

/* ── form field ────────────────────────────────────────────────────────── */

function FormField({
  field,
  value,
  error,
  onChange,
  onPick,
}: {
  field: FieldDef;
  value: any;
  error?: string;
  onChange: (v: any) => void;
  onPick: () => void;
}) {
  const span = field.colSpan === 2 ? "sm:col-span-2" : "";

  switch (field.type) {
    case "richtext":
      return (
        <div className={span}>
          <Field label={field.label} required={field.required} error={error} hint={field.help}>
            <RichTextEditor value={value ?? ""} onChange={onChange} />
          </Field>
        </div>
      );
    case "textarea":
      return (
        <div className={span}>
          <Field label={field.label} required={field.required} error={error} hint={field.help}>
            <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />
          </Field>
        </div>
      );
    case "select":
      return (
        <Field label={field.label} required={field.required} error={error} hint={field.help}>
          <Select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
            <option value="">Select…</option>
            {(field.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
      );
    case "switch":
      return (
        <div className="flex items-end pb-1">
          <Field label={field.label} hint={field.help}>
            <Switch checked={!!value} onChange={onChange} />
          </Field>
        </div>
      );
    case "image":
    case "file":
      return (
        <Field label={field.label} required={field.required} error={error} hint={field.help}>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onPick}>
              <Icon name={field.type === "image" ? "image" : "file-text"} size={16} />
              {value ? "Change" : "Choose"} {field.type === "image" ? "image" : "file"}
            </Button>
            {value && (
              <>
                {field.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${mediaUrl(value)}?thumb=1`} alt="" className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <Badge tone="brand">File #{value}</Badge>
                )}
                <button type="button" onClick={() => onChange(null)} className="text-xs font-medium text-rose-600 hover:underline">
                  Remove
                </button>
              </>
            )}
          </div>
        </Field>
      );
    case "number":
      return (
        <Field label={field.label} required={field.required} error={error} hint={field.help}>
          <Input
            type="number"
            min={field.min}
            max={field.max}
            value={value ?? 0}
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </Field>
      );
    case "datetime":
    case "date":
      return (
        <Field label={field.label} required={field.required} error={error} hint={field.help}>
          <Input
            type={field.type === "datetime" ? "datetime-local" : "date"}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </Field>
      );
    default:
      return (
        <Field label={field.label} required={field.required} error={error} hint={field.help}>
          <Input
            type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        </Field>
      );
  }
}
