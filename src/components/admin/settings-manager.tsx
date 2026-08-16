"use client";

import { useEffect, useState } from "react";
import { api, firstFieldError } from "@/lib/client/api";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { Spinner } from "../ui/primitives";
import { Field, Input, Textarea } from "../ui/forms";
import { toast } from "../ui/toast";

interface FieldConfig {
  key: string;
  label: string;
  type?: "text" | "textarea" | "url" | "number";
  hint?: string;
}

const GROUPS: { title: string; icon: string; fields: FieldConfig[] }[] = [
  {
    title: "School identity",
    icon: "building",
    fields: [
      { key: "school_name", label: "School name" },
      { key: "tagline", label: "Tagline" },
      { key: "motto", label: "Motto" },
      { key: "founded_year", label: "Founded year", type: "number" },
      { key: "description", label: "Short description", type: "textarea" },
    ],
  },
  {
    title: "Contact details",
    icon: "mail",
    fields: [
      { key: "phone", label: "Phone" },
      { key: "email", label: "General email", type: "text" },
      { key: "admission_email", label: "Admissions email", type: "text" },
      { key: "address", label: "Address" },
      { key: "working_hours", label: "Working hours" },
      { key: "map_embed_url", label: "Map embed URL", type: "url", hint: "Google Maps embed URL shown on the contact page." },
    ],
  },
  {
    title: "Social media",
    icon: "globe",
    fields: [
      { key: "facebook", label: "Facebook URL", type: "url" },
      { key: "twitter", label: "X / Twitter URL", type: "url" },
      { key: "instagram", label: "Instagram URL", type: "url" },
      { key: "youtube", label: "YouTube URL", type: "url" },
      { key: "linkedin", label: "LinkedIn URL", type: "url" },
    ],
  },
  {
    title: "SEO",
    icon: "search",
    fields: [
      { key: "meta_title", label: "Default meta title" },
      { key: "meta_description", label: "Default meta description", type: "textarea" },
    ],
  },
  {
    title: "Homepage statistics",
    icon: "activity",
    fields: [
      { key: "stats_students", label: "Students", type: "number" },
      { key: "stats_teachers", label: "Teachers", type: "number" },
      { key: "stats_graduates", label: "Graduates", type: "number" },
      { key: "stats_awards", label: "Awards won", type: "number" },
    ],
  },
];

export function SettingsManager() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState({ name: "", current_password: "", password: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get<{ settings: Record<string, string> }>("/api/admin/settings"), api.get<{ name: string }>("/api/auth/me")])
      .then(([settingsData, me]) => {
        setValues(settingsData.settings);
        setProfile((p) => ({ ...p, name: me.name }));
      })
      .catch((e) => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      await api.put("/api/admin/settings", { settings: values });
      toast("Settings saved");
    } catch (e) {
      toast(firstFieldError(e) ?? "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile() {
    setProfileSaving(true);
    try {
      await api.post("/api/auth/change-password", profile);
      setProfile((p) => ({ ...p, current_password: "", password: "" }));
      toast("Profile updated");
    } catch (e) {
      toast(firstFieldError(e) ?? "Failed to update profile", "error");
    } finally {
      setProfileSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="text-brand-600" /></div>;

  return (
    <div className="space-y-6">
      {/* profile */}
      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-ink-950">My profile</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Display name">
            <Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
          </Field>
          <Field label="Current password">
            <Input type="password" value={profile.current_password} onChange={(e) => setProfile((p) => ({ ...p, current_password: e.target.value }))} />
          </Field>
          <Field label="New password" hint="Leave blank to keep your current password.">
            <Input type="password" value={profile.password} onChange={(e) => setProfile((p) => ({ ...p, password: e.target.value }))} />
          </Field>
        </div>
        <div className="mt-4">
          <Button onClick={saveProfile} loading={profileSaving}>Update profile</Button>
        </div>
      </div>

      {GROUPS.map((group) => (
        <div key={group.title} className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-950">
            <Icon name={group.icon as any} size={18} className="text-brand-600" /> {group.title}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {group.fields.map((f) => (
              <Field key={f.key} label={f.label} hint={f.hint} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                {f.type === "textarea" ? (
                  <Textarea value={values[f.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
                ) : (
                  <Input type={f.type === "number" ? "number" : f.type === "url" ? "url" : "text"} value={values[f.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
                )}
              </Field>
            ))}
          </div>
        </div>
      ))}

      <div className="sticky bottom-4 flex justify-end">
        <Button size="lg" onClick={save} loading={saving} className="shadow-card">
          <Icon name="check" size={16} /> Save all settings
        </Button>
      </div>
    </div>
  );
}
