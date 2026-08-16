import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ContactForm } from "@/components/forms/contact-form";
import { Icon } from "@/components/ui/icon";
import { siteSettings } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Contact Us", description: "Get in touch with Maplebrook International Academy." };
}

export default function ContactPage() {
  const s = siteSettings();

  const info = [
    { icon: "map-pin" as const, label: "Address", value: s.address },
    { icon: "phone" as const, label: "Phone", value: s.phone },
    { icon: "mail" as const, label: "Email", value: s.email },
    { icon: "clock" as const, label: "Office hours", value: s.workingHours },
  ];

  return (
    <>
      <PageHeader title="Contact Us" subtitle="We'd love to hear from you — a question, a visit, or anything in between." crumb="contact" />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink-950">Send us a message</h2>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink-950">Visit us</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {info.map((i) => (
                <div key={i.label} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon name={i.icon} size={18} />
                  </div>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{i.label}</p>
                  <p className="mt-1 break-words text-sm text-ink-800">{i.value}</p>
                </div>
              ))}
            </div>
            {s.mapEmbedUrl && (
              <div className="mt-6 overflow-hidden rounded-3xl border border-ink-100 shadow-sm">
                <iframe
                  src={s.mapEmbedUrl}
                  title="Map"
                  className="h-72 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
