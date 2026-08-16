"use client";

import { useState } from "react";
import { Field, Input, Textarea } from "../ui/forms";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";

export function ContactForm() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, v));
    fd.append("website", "");

    try {
      const res = await fetch("/api/public/contact", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok) {
        setSent(true);
        setValues({});
      } else {
        const fields = json.error?.fields ?? {};
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(fields)) flat[k] = (v as string[])[0];
        if (!Object.keys(flat).length) flat._form = json.error?.message ?? "Something went wrong.";
        setErrors(flat);
      }
    } catch {
      setErrors({ _form: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Icon name="check" size={26} strokeWidth={3} />
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold text-ink-950">Message sent!</h3>
        <p className="mt-1 text-sm text-ink-600">Thank you for reaching out. We'll get back to you shortly.</p>
        <Button variant="outline" className="mt-5" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {errors._form && (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errors._form}</div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="c-name" required error={errors.name}>
          <Input id="c-name" value={values.name ?? ""} onChange={set("name")} required />
        </Field>
        <Field label="Email" htmlFor="c-email" required error={errors.email}>
          <Input id="c-email" type="email" value={values.email ?? ""} onChange={set("email")} required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone (optional)" htmlFor="c-phone" error={errors.phone}>
          <Input id="c-phone" type="tel" value={values.phone ?? ""} onChange={set("phone")} />
        </Field>
        <Field label="Subject" htmlFor="c-subject" error={errors.subject}>
          <Input id="c-subject" value={values.subject ?? ""} onChange={set("subject")} />
        </Field>
      </div>
      <Field label="Message" htmlFor="c-message" required error={errors.message}>
        <Textarea id="c-message" value={values.message ?? ""} onChange={set("message")} required />
      </Field>
      <div className="hidden" aria-hidden="true">
        <input tabIndex={-1} autoComplete="off" name="website" value={values.website ?? ""} onChange={set("website")} />
      </div>
      <Button type="submit" size="lg" loading={busy}>
        Send message <Icon name="send" size={16} />
      </Button>
    </form>
  );
}
