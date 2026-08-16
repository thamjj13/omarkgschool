"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Field, Input } from "../ui/forms";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
import { api } from "@/lib/client/api";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const data = await api.post<{ message: string; resetUrl?: string }>("/api/auth/forgot-password", { email });
      setMessage(data.message);
      if (data.resetUrl) setResetUrl(data.resetUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function doReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = await api.post<{ message: string }>("/api/auth/reset-password", { token, password });
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (token && message) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Icon name="check" size={26} strokeWidth={3} />
        </div>
        <p className="mt-4 text-ink-700">{message}</p>
        <Link href="/admin/login" className="mt-4 inline-flex font-semibold text-brand-600 hover:underline">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          <Icon name="alert" size={17} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {token ? (
        <form onSubmit={doReset} className="space-y-4">
          <Field label="New password" htmlFor="rp-password" required hint="At least 8 characters, including a letter and a number.">
            <Input id="rp-password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Field label="Confirm password" htmlFor="rp-confirm" required>
            <Input id="rp-confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
          <Button type="submit" loading={busy} className="w-full" size="lg">Reset password</Button>
        </form>
      ) : message ? (
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Icon name="check" size={26} strokeWidth={3} />
          </div>
          <p className="mt-4 text-ink-700">{message}</p>
          {resetUrl && (
            <a href={resetUrl} className="mt-4 inline-flex font-semibold text-brand-600 hover:underline">
              Open reset link (dev mode)
            </a>
          )}
        </div>
      ) : (
        <form onSubmit={requestReset} className="space-y-4">
          <Field label="Email" htmlFor="rp-email" required>
            <Input id="rp-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@maplebrook.edu" />
          </Field>
          <Button type="submit" loading={busy} className="w-full" size="lg">Send reset link</Button>
          <p className="text-center text-sm text-ink-500">
            <Link href="/admin/login" className="font-medium text-brand-600 hover:underline">Back to login</Link>
          </p>
        </form>
      )}
    </div>
  );
}
