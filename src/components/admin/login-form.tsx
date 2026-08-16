"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Input } from "../ui/forms";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
import { api } from "@/lib/client/api";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/auth/login", { email, password });
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          <Icon name="alert" size={17} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}
      <Field label="Email" htmlFor="login-email" required>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@maplebrook.edu"
        />
      </Field>
      <Field label="Password" htmlFor="login-password" required>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </Field>
      <Button type="submit" loading={busy} className="w-full" size="lg">
        Sign in
      </Button>
      <p className="text-center text-sm text-ink-500">
        <a href="/admin/reset-password" className="font-medium text-brand-600 hover:underline">
          Forgot your password?
        </a>
      </p>
    </form>
  );
}
