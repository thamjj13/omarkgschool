import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-6 py-24">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
          <Icon name="help" size={30} />
        </div>
        <p className="mt-6 font-display text-7xl font-semibold text-brand-600">404</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink-950">Page not found</h1>
        <p className="mx-auto mt-2 max-w-md text-ink-500">
          The page you're looking for may have moved or no longer exists.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button href="/">Back to home</Button>
          <Button href="/contact" variant="outline">Contact us</Button>
        </div>
      </div>
    </section>
  );
}
