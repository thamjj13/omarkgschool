import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { AdmissionForm } from "@/components/forms/admission-form";
import { listPrograms } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Apply for Admission", description: "Submit an online admission application to Maplebrook International Academy." };
}

export default function ApplyPage() {
  const grades = listPrograms().map((p) => ({ name: p.name, grade_level: p.grade_level }));

  return (
    <>
      <PageHeader title="Apply for Admission" subtitle="Complete the form below to begin your child's journey with us." crumb="admissions" />
      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-10">
          <AdmissionForm grades={grades} />
        </div>
      </section>
    </>
  );
}
