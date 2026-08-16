import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { FaqAccordion } from "@/components/faq-accordion";
import { listFaqs } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Frequently Asked Questions", description: "Answers to common questions about Maplebrook International Academy." };
}

export default function FaqPage() {
  const faqs = listFaqs();
  const categories = Array.from(new Set(faqs.map((f) => f.category || "General")));

  return (
    <>
      <PageHeader title="Frequently Asked Questions" subtitle="Everything you need to know about life at Maplebrook." crumb="faq" />
      <section className="mx-auto max-w-3xl px-6 py-12">
        {categories.map((cat) => (
          <div key={cat} className="mb-10">
            <h2 className="mb-4 font-display text-xl font-semibold text-ink-950">{cat}</h2>
            <FaqAccordion items={faqs.filter((f) => (f.category || "General") === cat)} />
          </div>
        ))}
      </section>
    </>
  );
}
