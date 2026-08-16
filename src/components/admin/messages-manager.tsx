"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { formatDateTime } from "@/lib/utils";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { Badge, Spinner, EmptyState } from "../ui/primitives";
import { Modal } from "../ui/modal";
import { Select } from "../ui/forms";
import { toast } from "../ui/toast";

const STATUSES = ["unread", "read", "responded"];
const COLORS: Record<string, string> = {
  unread: "bg-rose-100 text-rose-700",
  read: "bg-slate-200 text-slate-600",
  responded: "bg-emerald-100 text-emerald-800",
};

interface Message {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export function MessagesManager() {
  const [items, setItems] = useState<Message[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Message | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (q) params.set("q", q);
      if (status !== "all") params.set("status", status);
      const data = await api.get<{ items: Message[]; total: number }>(`/api/admin/messages?${params}`);
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

  async function openDetail(m: Message) {
    setDetail(m);
    if (m.status === "unread") {
      await api.patch(`/api/admin/messages/${m.id}`, { status: "read" }).catch(() => {});
      load();
    }
  }

  async function setMessageStatus(m: Message, s: string) {
    try {
      await api.patch(`/api/admin/messages/${m.id}`, { status: s });
      toast("Status updated");
      setDetail(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to update", "error");
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/admin/messages/${deleteTarget.id}`);
      toast("Message deleted");
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
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search messages…" className="w-72 rounded-xl border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none" />
        </div>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-auto">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <span className="ml-auto text-sm text-ink-500">{total} message{total === 1 ? "" : "s"}</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60">
              <th className="px-4 py-3 font-semibold text-ink-600">From</th>
              <th className="px-4 py-3 font-semibold text-ink-600">Subject</th>
              <th className="px-4 py-3 font-semibold text-ink-600">Status</th>
              <th className="px-4 py-3 font-semibold text-ink-600">Received</th>
              <th className="px-4 py-3 text-right font-semibold text-ink-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center"><Spinner className="text-brand-600" /></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5}><EmptyState icon="mail" title="No messages" /></td></tr>
            ) : (
              items.map((m) => (
                <tr key={m.id} className="cursor-pointer hover:bg-ink-50/50" onClick={() => openDetail(m)}>
                  <td className="px-4 py-3">
                    <p className={m.status === "unread" ? "font-semibold text-ink-900" : "text-ink-700"}>{m.name}</p>
                    <p className="text-xs text-ink-400">{m.email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{m.subject || "—"}</td>
                  <td className="px-4 py-3"><Badge className={COLORS[m.status] ?? ""}>{m.status}</Badge></td>
                  <td className="px-4 py-3 text-ink-500">{formatDateTime(m.created_at)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openDetail(m)} className="rounded-lg p-2 text-ink-500 hover:bg-brand-50 hover:text-brand-700" aria-label="View"><Icon name="eye" size={16} /></button>
                      <button onClick={() => setDeleteTarget(m)} className="rounded-lg p-2 text-ink-500 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete"><Icon name="trash" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={detail !== null} onClose={() => setDetail(null)} title={detail?.subject || "Message"} size="md"
        footer={detail && (
          <>
            <Button variant="outline" onClick={() => setMessageStatus(detail, "responded")}><Icon name="check" size={15} /> Mark responded</Button>
            <a href={`mailto:${detail.email}`} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
              <Icon name="mail" size={15} /> Reply by email
            </a>
          </>
        )}>
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 rounded-xl bg-ink-50 p-4 text-sm">
              <span><strong>From:</strong> {detail.name}</span>
              <span><strong>Email:</strong> {detail.email}</span>
              {detail.phone && <span><strong>Phone:</strong> {detail.phone}</span>}
              <span><strong>Received:</strong> {formatDateTime(detail.created_at)}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">{detail.message}</p>
          </div>
        )}
      </Modal>

      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete message" size="sm">
        <p className="text-sm text-ink-600">Delete this message from <strong>{deleteTarget?.name}</strong>?</p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={remove}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
