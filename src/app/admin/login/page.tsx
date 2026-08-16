import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/admin/login-form";
import { Icon } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Admin Login", robots: { index: false, follow: false } };
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ink-950 via-brand-900 to-ink-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <Link href="/">
              <Logo name="Maplebrook" />
            </Link>
            <h1 className="mt-5 font-display text-2xl font-semibold text-ink-950">Admin console</h1>
            <p className="mt-1 text-sm text-ink-500">Sign in to manage the website.</p>
          </div>

          <div className="mt-7">
            <LoginForm />
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-ink-200 backdrop-blur">
          <p className="flex items-center gap-2 font-semibold text-white">
            <Icon name="info" size={16} /> Demo credentials
          </p>
          <div className="mt-2 space-y-1 text-ink-300">
            <p><strong className="text-accent-300">Super admin</strong> — admin@maplebrook.edu / ChangeMe123!</p>
            <p><strong className="text-accent-300">Editor</strong> — editor@maplebrook.edu / Editor123!</p>
            <p><strong className="text-accent-300">Staff</strong> — staff@maplebrook.edu / Staff123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
