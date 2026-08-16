"use client";

import { useState } from "react";
import { Field, Input, Select, Textarea } from "../ui/forms";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";

const GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say"];
const RELATIONS = ["Mother", "Father", "Guardian", "Other"];

export function AdmissionForm({ grades }: { grades: { name: string; grade_level: string }[] }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ applicationNo: string } | null>(null);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});

    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, v));
    fd.append("website", ""); // honeypot

    try {
      const res = await fetch("/api/public/admissions", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok) {
        setDone({ applicationNo: json.data.applicationNo });
        setValues({});
      } else {
        const fields = json.error?.fields ?? {};
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(fields)) {
          flat[k] = (v as string[])[0];
        }
        if (!Object.keys(flat).length) flat._form = json.error?.message ?? "Something went wrong.";
        setErrors(flat);
      }
    } catch {
      setErrors({ _form: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-emerald-200 bg-emerald-50 p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Icon name="check" size={30} strokeWidth={3} />
        </div>
        <h2 className="mt-5 font-display text-2xl font-semibold text-ink-950">Application received!</h2>
        <p className="mt-2 text-ink-600">
          Thank you. Your reference number is <strong className="text-emerald-700">{done.applicationNo}</strong>.
        </p>
        <p className="mt-1 text-sm text-ink-500">Our admissions team will contact you within three working days.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {errors._form && (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errors._form}</div>
      )}

      <fieldset>
        <legend className="mb-3 font-display text-lg font-semibold text-ink-950">Student information</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="studentFirstName" required error={errors.studentFirstName}>
            <Input id="studentFirstName" value={values.studentFirstName ?? ""} onChange={set("studentFirstName")} required />
          </Field>
          <Field label="Last name" htmlFor="studentLastName" required error={errors.studentLastName}>
            <Input id="studentLastName" value={values.studentLastName ?? ""} onChange={set("studentLastName")} required />
          </Field>
          <Field label="Date of birth" htmlFor="dateOfBirth" required error={errors.dateOfBirth}>
            <Input id="dateOfBirth" type="date" value={values.dateOfBirth ?? ""} onChange={set("dateOfBirth")} required />
          </Field>
          <Field label="Gender" htmlFor="gender" required error={errors.gender}>
            <Select id="gender" value={values.gender ?? ""} onChange={set("gender")} required>
              <option value="">Select…</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </Select>
          </Field>
          <Field label="Grade / class applying for" htmlFor="gradeApplyingFor" required error={errors.gradeApplyingFor}>
            <Select id="gradeApplyingFor" value={values.gradeApplyingFor ?? ""} onChange={set("gradeApplyingFor")} required>
              <option value="">Select…</option>
              {grades.map((g) => (
                <option key={g.name} value={g.name}>
                  {g.name}{g.grade_level ? ` (${g.grade_level})` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Previous school (optional)" htmlFor="previousSchool" error={errors.previousSchool}>
            <Input id="previousSchool" value={values.previousSchool ?? ""} onChange={set("previousSchool")} />
          </Field>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 font-display text-lg font-semibold text-ink-950">Parent / guardian information</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Guardian name" htmlFor="guardianName" required error={errors.guardianName}>
            <Input id="guardianName" value={values.guardianName ?? ""} onChange={set("guardianName")} required />
          </Field>
          <Field label="Relationship" htmlFor="guardianRelation" error={errors.guardianRelation}>
            <Select id="guardianRelation" value={values.guardianRelation ?? ""} onChange={set("guardianRelation")}>
              <option value="">Select…</option>
              {RELATIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
          </Field>
          <Field label="Email" htmlFor="guardianEmail" required error={errors.guardianEmail}>
            <Input id="guardianEmail" type="email" value={values.guardianEmail ?? ""} onChange={set("guardianEmail")} required />
          </Field>
          <Field label="Phone" htmlFor="guardianPhone" required error={errors.guardianPhone}>
            <Input id="guardianPhone" type="tel" value={values.guardianPhone ?? ""} onChange={set("guardianPhone")} required />
          </Field>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 font-display text-lg font-semibold text-ink-950">Address & message</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Address" htmlFor="address" className="sm:col-span-2" error={errors.address}>
            <Input id="address" value={values.address ?? ""} onChange={set("address")} />
          </Field>
          <Field label="City" htmlFor="city" error={errors.city}>
            <Input id="city" value={values.city ?? ""} onChange={set("city")} />
          </Field>
          <Field label="Country" htmlFor="country" error={errors.country}>
            <Input id="country" value={values.country ?? ""} onChange={set("country")} />
          </Field>
          <Field label="Anything else we should know?" htmlFor="message" className="sm:col-span-2" error={errors.message}>
            <Textarea id="message" value={values.message ?? ""} onChange={set("message")} />
          </Field>
        </div>
      </fieldset>

      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" name="website" value={values.website ?? ""} onChange={set("website")} />
        </label>
      </div>

      <Button type="submit" size="lg" loading={busy} className="w-full sm:w-auto">
        Submit application
      </Button>
      <p className="text-xs text-ink-400">By submitting you agree to our admissions policy. We'll respond within three working days.</p>
    </form>
  );
}
