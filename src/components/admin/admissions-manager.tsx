"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { formatDateTime } from "@/lib/utils";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { Badge, Spinner, EmptyState } from "../ui/primitives";
import { Modal } from "../ui/modal";
import { Field, Select, Textarea } from "../ui/forms";
import { toast } from "../ui/toast";
import { cn } from "@/lib/utils";

const STATUSES = ["pending", "reviewing", "accepted", "rejected"];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  reviewing: "bg-sky-100 text-sky-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
};

interface Admission {
  id: number;
  application_no: string;
  student_first_name: string;
  student_last_name: string;
  grade_applying_for: string;
  guardian_name: string;
  guardian_email: string;
  guardian_phone: string;
  status: string;
  submitted_at: string;
  date_of_birth: string;
  gender: string;
  previous_school: string;
  guardian_relation: string;
  address: string;
  city: string;
  country: string;
  message: string;
  review_notes: string;
}

export function AdmissionsManager() {
  const [items, setItems] = useState<Admission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Admission | null>(null);
  const [form, setForm] = useState({ status: "pending", review_notes: "" });
  const [deleteTarget, setDeleteTarget] = useState<Admission | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (q) params.set("q", q);
      if (status !== "all") params.set("status", status);
      const data = await api.get<{ items: Admission[]; total: number }>(`/api/admin/admissions?${params}`);
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }, [page, q, status]);

  useEffect(() => {
    load();
  }, [load]);

  function openDetail(a: Admission) {
    setDetail(a);
    setForm({ status: a.status, review_notes: a.review_notes });
  }

  async function saveStatus() {
    if (!detail) return;
    try {
      await api.patch(`/api/admin/admissions/${detail.id}`, form);
      toast("Application updated");
      setDetail(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to update", "error");
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/admin/admissions/${deleteTarget.id}`);
      toast("Application deleted");
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to delete", "error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search applications…" className="w-72 rounded-xl border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none" />
        </div>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-auto">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <span className="ml-auto text-sm text-ink-500">{total} application{total === 1 ? "" : "s"}</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60">
              <th className="px-4 py-3 font-semibold text-ink-600">Reference</th>
              <th className="px-4 py-3 font-semibold text-ink-600">Student</th>
              <th className="px-4 py-3 font-semibold text-ink-600">Grade</th>
              <th className="px-4 py-3 font-semibold text-ink-600">Guardian</th>
              <th className="px-4 py-3 font-semibold text-ink-600">Status</th>
              <th className="px-4 py-3 font-semibold text-ink-600">Submitted</th>
              <th className="px-4 py-3 text-right font-semibold text-ink-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center"><Spinner className="text-brand-600" /></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7}><EmptyState icon="file-text" title="No applications" description={q ? "No results match your search." : "Applications will appear here."} /></td></tr>
            ) : (
              items.map((a) => (
                <tr key={a.id} className="cursor-pointer hover:bg-ink-50/50" onClick={() => openDetail(a)}>
                  <td className="px-4 py-3 font-mono text-xs text-ink-600">{a.application_no}</td>
                  <td className="px-4 py-3 font-medium text-ink-900">{a.student_first_name} {a.student_last_name}</td>
                  <td className="px-4 py-3 text-ink-600">{a.grade_applying_for}</td>
                  <td className="px-4 py-3 text-ink-600">{a.guardian_name}</td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[a.status] ?? ""}>{a.status}</Badge></td>
                  <td className="px-4 py-3 text-ink-500">{formatDateTime(a.submitted_at)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openDetail(a)} className="rounded-lg p-2 text-ink-500 hover:bg-brand-50 hover:text-brand-700" aria-label="View"><Icon name="eye" size={16} /></button>
                      <button onClick={() => setDeleteTarget(a)} className="rounded-lg p-2 text-ink-500 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete"><Icon name="trash" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      <Modal open={detail !== null} onClose={() => setDetail(null)} title={detail ? `Application ${detail.application_no}` : ""} size="lg"
        footer={<><Button variant="danger" onClick={() => { setDeleteTarget(detail); setDetail(null); }}>Delete</Button><div className="flex-1" /><Button onClick={saveStatus}>Save status</Button></>}>
        {detail && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="Student" value={`${detail.student_first_name} ${detail.student_last_name}`} />
              <Info label="Date of birth" value={detail.date_of_birth} />
              <Info label="Gender" value={detail.gender} />
              <Info label="Grade applying for" value={detail.grade_applying_for} />
              <Info label="Previous school" value={detail.previous_school || "—"} />
              <Info label="Guardian" value={`${detail.guardian_name} (${detail.guardian_relation || "guardian"})`} />
              <Info label="Guardian email" value={detail.guardian_email} />
              <Info label="Guardian phone" value={detail.guardian_phone} />
              <Info label="Address" value={[detail.address, detail.city, detail.country].filter(Boolean).join(", ") || "—"} />
            </div>
            {detail.message && (
              <div className="rounded-xl bg-ink-50 p-4 text-sm text-ink-600">
                <p className="mb-1 font-semibold text-ink-800">Message from family</p>
                {detail.message}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status">
                <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="Review notes">
                <Textarea value={form.review_notes} onChange={(e) => setForm((f) => ({ ...f, review_notes: e.target.value }))} />
              </Field>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete application" size="sm">
        <p className="text-sm text-ink-600">Delete application <strong>{deleteTarget?.application_no}</strong>?</p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={remove}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-0.5 text-sm text-ink-900">{value}</p>
    </div>
  );
}
