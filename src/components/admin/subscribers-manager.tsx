"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { formatDate } from "@/lib/utils";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { Badge, Spinner, EmptyState } from "../ui/primitives";
import { toast } from "../ui/toast";

interface Subscriber {
  id: number;
  email: string;
  status: string;
  created_at: string;
}

export function SubscribersManager() {
  const [items, setItems] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "25" });
      if (q) params.set("q", q);
      const data = await api.get<{ items: Subscriber[]; total: number }>(`/api/admin/subscribers?${params}`);
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }, [page, q]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(s: Subscriber, status: string) {
    try {
      await api.patch(`/api/admin/subscribers/${s.id}`, { status });
      toast(status === "subscribed" ? "Subscribed" : "Unsubscribed");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "error");
    }
  }

  async function remove(s: Subscriber) {
    try {
      await api.delete(`/api/admin/subscribers/${s.id}`);
      toast("Subscriber removed");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search subscribers…" className="w-72 rounded-xl border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none" />
        </div>
        <span className="ml-auto text-sm text-ink-500">{total} subscriber{total === 1 ? "" : "s"}</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60">
              <th className="px-4 py-3 font-semibold text-ink-600">Email</th>
              <th className="px-4 py-3 font-semibold text-ink-600">Status</th>
              <th className="px-4 py-3 font-semibold text-ink-600">Subscribed</th>
              <th className="px-4 py-3 text-right font-semibold text-ink-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center"><Spinner className="text-brand-600" /></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4}><EmptyState icon="send" title="No subscribers" /></td></tr>
            ) : (
              items.map((s) => (
                <tr key={s.id} className="hover:bg-ink-50/50">
                  <td className="px-4 py-3 font-medium text-ink-900">{s.email}</td>
                  <td className="px-4 py-3"><Badge tone={s.status === "subscribed" ? "emerald" : "slate"}>{s.status}</Badge></td>
                  <td className="px-4 py-3 text-ink-500">{formatDate(s.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {s.status === "subscribed" ? (
                        <button onClick={() => setStatus(s, "unsubscribed")} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-500 hover:bg-ink-100">Unsubscribe</button>
                      ) : (
                        <button onClick={() => setStatus(s, "subscribed")} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50">Resubscribe</button>
                      )}
                      <button onClick={() => remove(s)} className="rounded-lg p-2 text-ink-500 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete"><Icon name="trash" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {total > 25 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
