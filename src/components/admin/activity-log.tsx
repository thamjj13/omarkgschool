"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { formatDateTime } from "@/lib/utils";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { Spinner, EmptyState } from "../ui/primitives";
import { Select } from "../ui/forms";
import { toast } from "../ui/toast";

interface ActivityRow {
  id: number;
  user_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  ip: string | null;
  created_at: string;
}

export function ActivityLog() {
  const [items, setItems] = useState<ActivityRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [action, setAction] = useState("all");
  const [loading, setLoading] = useState(true);

  const actions = ["auth.login", "auth.logout", "auth.reset_password", "media.upload", "media.delete", "settings.update", "navigation.create", "navigation.update", "navigation.delete", "homepage.update", "users.create", "users.update", "users.delete", "roles.update_permissions", "admissions.status", "messages.status"];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "25" });
      if (q) params.set("q", q);
      if (action !== "all") params.set("action", action);
      const data = await api.get<{ items: ActivityRow[]; total: number }>(`/api/admin/activity?${params}`);
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }, [page, q, action]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search activity…" className="w-72 rounded-xl border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none" />
        </div>
        <Select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className="w-auto">
          <option value="all">All actions</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60">
              <th className="px-4 py-3 font-semibold text-ink-600">User</th>
              <th className="px-4 py-3 font-semibold text-ink-600">Action</th>
              <th className="px-4 py-3 font-semibold text-ink-600">Entity</th>
              <th className="px-4 py-3 font-semibold text-ink-600">IP</th>
              <th className="px-4 py-3 font-semibold text-ink-600">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center"><Spinner className="text-brand-600" /></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5}><EmptyState icon="activity" title="No activity recorded" /></td></tr>
            ) : (
              items.map((a) => (
                <tr key={a.id} className="hover:bg-ink-50/50">
                  <td className="px-4 py-3 font-medium text-ink-900">{a.user_name ?? "System"}</td>
                  <td className="px-4 py-3"><span className="rounded-md bg-brand-50 px-2 py-1 font-mono text-xs text-brand-700">{a.action}</span></td>
                  <td className="px-4 py-3 text-ink-600">{a.entity_type}{a.entity_id ? ` #${a.entity_id}` : ""}</td>
                  <td className="px-4 py-3 text-ink-400">{a.ip ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-500">{formatDateTime(a.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-2">
        <span className="mr-auto text-sm text-ink-500">{total} events</span>
        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
        <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>
    </div>
  );
}
