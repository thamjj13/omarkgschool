"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex min-h-[60vh] items-center justify-center px-6 py-24">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <Icon name="alert" size={30} />
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold text-ink-950">Something went wrong</h1>
        <p className="mx-auto mt-2 max-w-md text-ink-500">
          An unexpected error occurred. Please try again, or head back to the homepage.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button href="/" variant="outline">Back to home</Button>
        </div>
      </div>
    </section>
  );
}
