import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/primitives";
import { listPrograms } from "@/lib/services/site";
import { siteSettings } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Admissions", description: "How to apply to Maplebrook International Academy." };
}

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "file-text", title: "1 · Submit an application", text: "Complete the online form with your child's details. It takes about five minutes." },
  { icon: "calendar", title: "2 · Assessment & tour", text: "We invite you for a campus tour and an age-appropriate, friendly assessment." },
  { icon: "check", title: "3 · Offer & enrolment", text: "Successful applicants receive a written offer, after which you complete enrolment." },
];

const REQUIREMENTS = [
  "Completed application form",
  "Copy of the student's birth certificate or passport",
  "Two most recent school reports (if applicable)",
  "A recent passport-size photograph",
  "Immunisation / medical record",
];

export default function AdmissionsPage() {
  const programs = listPrograms();
  const s = siteSettings();

  return (
    <>
      <PageHeader
        title="Admissions"
        subtitle="Joining Maplebrook is simple, personal and welcoming. Here's how it works."
        crumb="admissions"
      />

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.title} className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Icon name={step.icon} size={22} />
              </div>
              <h2 className="mt-4 font-display text-lg font-semibold text-ink-950">{step.title}</h2>
              <p className="mt-1.5 text-sm text-ink-500">{step.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink-950">What you'll need</h2>
            <ul className="mt-4 space-y-3">
              {REQUIREMENTS.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-ink-700">
                  <Icon name="check" size={18} className="mt-0.5 shrink-0 text-brand-600" />
                  {r}
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-2xl bg-accent-50 p-6">
              <p className="font-display text-lg font-semibold text-ink-950">Questions?</p>
              <p className="mt-1 text-sm text-ink-600">
                Our admissions team is happy to help:{" "}
                <a href={`mailto:${s.admissionEmail}`} className="font-medium text-brand-700 hover:underline">
                  {s.admissionEmail}
                </a>
              </p>
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink-950">Programs accepting applications</h2>
            <div className="mt-4 space-y-3">
              {programs.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-ink-100 bg-white px-4 py-3">
                  <div>
                    <p className="font-medium text-ink-900">{p.name}</p>
                    <p className="text-xs text-ink-500">{p.grade_level}</p>
                  </div>
                  <Button href={`/academics/programs/${p.slug}`} variant="ghost" size="sm">
                    Details
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ink-950 py-16">
        <div className="mx-auto max-w-4xl px-6 text-center text-white">
          <SectionHeading light eyebrow="Ready?" title="Start your application today" />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/admissions/apply" size="lg" variant="accent">Apply online</Button>
            <Button href="/contact" size="lg" variant="outline" className="border-white/25 bg-white/5 text-white hover:border-white/50 hover:text-white">
              Book a tour
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
