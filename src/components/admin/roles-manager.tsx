"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { cn } from "@/lib/utils";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { Badge, Spinner } from "../ui/primitives";
import { toast } from "../ui/toast";

interface Role {
  id: number;
  slug: string;
  name: string;
  description: string;
}
interface Permission {
  id: number;
  slug: string;
  name: string;
  resource: string;
  description: string;
}

export function RolesManager() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [active, setActive] = useState<Role | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ roles: Role[]; permissions: Permission[] }>("/api/admin/roles")
      .then((d) => {
        setRoles(d.roles);
        setPermissions(d.permissions);
        setActive(d.roles[0] ?? null);
      })
      .catch((e) => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!active) return;
    api
      .get<{ permissions: string[] }>(`/api/admin/roles/${active.id}/permissions`)
      .then((d) => setSelected(d.permissions))
      .catch(() => setSelected([]));
  }, [active]);

  function toggle(slug: string) {
    setSelected((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]));
  }

  async function save() {
    if (!active) return;
    setSaving(true);
    try {
      await api.put(`/api/admin/roles/${active.id}/permissions`, { permissions: selected });
      toast(`${active.name} permissions saved`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="text-brand-600" /></div>;

  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.resource] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => setActive(r)}
            className={cn(
              "rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
              active?.id === r.id ? "bg-brand-600 text-white" : "bg-white text-ink-700 border border-ink-200 hover:border-brand-400"
            )}
          >
            {r.name}
          </button>
        ))}
      </div>

      {active && (
        <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-semibold text-ink-950">{active.name}</h2>
                <Badge tone="slate">{active.slug}</Badge>
              </div>
              <p className="mt-1 text-sm text-ink-500">{active.description}</p>
            </div>
            <Button onClick={save} loading={saving}>Save permissions</Button>
          </div>

          <div className="mt-6 space-y-6">
            {Object.entries(grouped).map(([resource, perms]) => (
              <div key={resource}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">{resource}</h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {perms.map((p) => {
                    const on = selected.includes(p.slug);
                    return (
                      <button
                        key={p.slug}
                        onClick={() => toggle(p.slug)}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                          on ? "border-brand-300 bg-brand-50" : "border-ink-100 bg-white hover:border-ink-200"
                        )}
                      >
                        <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md", on ? "bg-brand-600 text-white" : "border border-ink-300")}>
                          {on && <Icon name="check" size={13} strokeWidth={3} />}
                        </span>
                        <span>
                          <span className="block text-sm font-medium text-ink-900">{p.name}</span>
                          <span className="block text-xs text-ink-500">{p.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
