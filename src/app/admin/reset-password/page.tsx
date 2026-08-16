import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ResetPasswordForm } from "@/components/admin/reset-password-form";
import { Spinner } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Reset Password", robots: { index: false, follow: false } };
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ink-950 via-brand-900 to-ink-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <Link href="/">
              <Logo name="Maplebrook" />
            </Link>
            <h1 className="mt-5 font-display text-2xl font-semibold text-ink-950">Reset your password</h1>
          </div>
          <div className="mt-7">
            <Suspense fallback={<div className="flex justify-center"><Spinner className="text-brand-600" /></div>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
