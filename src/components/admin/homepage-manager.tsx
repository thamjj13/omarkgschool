"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { cn } from "@/lib/utils";
import { mediaUrl } from "@/lib/media-url";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { Badge, Spinner } from "../ui/primitives";
import { Modal } from "../ui/modal";
import { Field, Input, Textarea, Switch } from "../ui/forms";
import { RichTextEditor } from "./rich-text-editor";
import { MediaPicker } from "./media-picker";
import { toast } from "../ui/toast";

interface Section {
  id: number;
  key: string;
  type: string;
  title: string;
  subtitle: string;
  body: string;
  media_id: number | null;
  enabled: number;
  display_order: number;
}

export function HomepageManager() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Section | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [picker, setPicker] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ sections: Section[] }>("/api/admin/homepage");
      setSections(data.sections);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(s: Section) {
    const next = [...sections];
    const idx = next.findIndex((x) => x.id === s.id);
    next[idx] = { ...s, enabled: s.enabled ? 0 : 1 };
    setSections(next);
    try {
      await api.put("/api/admin/homepage", {
        sections: next.map((x) => ({ id: x.id, display_order: x.display_order, enabled: !!x.enabled })),
      });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to update", "error");
      load();
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const next = [...sections];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    const reordered = next.map((x, i) => ({ ...x, display_order: i + 1 }));
    setSections(reordered);
    try {
      await api.put("/api/admin/homepage", {
        sections: reordered.map((x) => ({ id: x.id, display_order: x.display_order, enabled: !!x.enabled })),
      });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to reorder", "error");
      load();
    }
  }

  function openEdit(s: Section) {
    setEditing(s);
    setForm({ title: s.title, subtitle: s.subtitle, body: s.body, media_id: s.media_id });
  }

  async function save() {
    if (!editing) return;
    try {
      await api.patch(`/api/admin/homepage/${editing.id}`, form);
      toast("Section saved");
      setEditing(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to save", "error");
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="text-brand-600" /></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-500">Toggle, reorder and edit the sections that appear on the homepage.</p>
      <div className="space-y-3">
        {sections.map((s, i) => (
          <div key={s.id} className={cn("flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm", s.enabled ? "border-ink-100" : "border-dashed border-ink-200 opacity-70")}>
            <div className="flex flex-col gap-1">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded-md p-1 text-ink-400 hover:bg-ink-100 disabled:opacity-30" aria-label="Move up"><Icon name="chevron-up" size={16} /></button>
              <button onClick={() => move(i, 1)} disabled={i === sections.length - 1} className="rounded-md p-1 text-ink-400 hover:bg-ink-100 disabled:opacity-30" aria-label="Move down"><Icon name="chevron-down" size={16} /></button>
            </div>
            {s.media_id ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`${mediaUrl(s.media_id)}?thumb=1`} alt="" className="h-14 w-14 rounded-xl object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-ink-100 text-ink-300"><Icon name="home" size={20} /></div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-ink-900">{s.title || s.key}</p>
                <Badge tone="brand">{s.type}</Badge>
              </div>
              {s.subtitle && <p className="truncate text-sm text-ink-500">{s.subtitle}</p>}
            </div>
            <Switch checked={!!s.enabled} onChange={() => toggle(s)} label={s.enabled ? "Visible" : "Hidden"} />
            <button onClick={() => openEdit(s)} className="rounded-lg p-2 text-ink-500 hover:bg-brand-50 hover:text-brand-700" aria-label="Edit"><Icon name="pencil" size={16} /></button>
          </div>
        ))}
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={`Edit “${editing?.key}” section`} size="lg"
        footer={<><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <div className="space-y-4">
          <Field label="Title">
            <Input value={form.title ?? ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </Field>
          <Field label="Subtitle">
            <Input value={form.subtitle ?? ""} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
          </Field>
          {(editing?.type === "welcome" || editing?.type === "mission") && (
            <Field label="Content">
              <RichTextEditor value={form.body ?? ""} onChange={(v) => setForm((f) => ({ ...f, body: v }))} />
            </Field>
          )}
          {editing?.type !== "welcome" && editing?.type !== "mission" && (
            <Field label="Text">
              <Textarea value={form.body ?? ""} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
            </Field>
          )}
          <Field label="Image">
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setPicker(true)}>
                <Icon name="image" size={16} /> {form.media_id ? "Change image" : "Choose image"}
              </Button>
              {form.media_id && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`${mediaUrl(form.media_id)}?thumb=1`} alt="" className="h-10 w-10 rounded-lg object-cover" />
              )}
            </div>
          </Field>
        </div>
      </Modal>

      <MediaPicker open={picker} onClose={() => setPicker(false)} currentId={form.media_id} onSelect={(id) => { setForm((f) => ({ ...f, media_id: id })); setPicker(false); }} />
    </div>
  );
}
