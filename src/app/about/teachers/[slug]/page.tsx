import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MediaImg } from "@/components/media-img";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/cards";
import { getTeacherBySlug, listTeachers } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = getTeacherBySlug(slug);
  return { title: t ? t.name : "Teacher", description: t ? `${t.position} at Maplebrook International Academy.` : undefined };
}

export default async function TeacherDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const teacher = getTeacherBySlug(slug);
  if (!teacher) notFound();

  const colleagues = listTeachers().filter((t) => t.id !== teacher.id).slice(0, 3);

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <Link href="/about/teachers" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">
        <Icon name="arrow-left" size={16} /> All teachers
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[320px_1fr]">
        <div>
          {teacher.photo_id ? (
            <div className="overflow-hidden rounded-3xl shadow-soft">
              <MediaImg id={teacher.photo_id} alt={teacher.name} className="aspect-[3/4] w-full" eager />
            </div>
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center rounded-3xl bg-gradient-to-br from-brand-100 to-accent-100">
              <Avatar name={teacher.name} className="h-32 w-32 text-4xl" />
            </div>
          )}
        </div>
        <div>
          <h1 className="font-display text-4xl font-semibold text-ink-950">{teacher.name}</h1>
          <p className="mt-1 text-lg font-medium text-brand-600">{teacher.position}</p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {teacher.department_name && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Department</dt>
                <dd className="mt-1 text-sm text-ink-800">{teacher.department_name}</dd>
              </div>
            )}
            {teacher.subject && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Subject</dt>
                <dd className="mt-1 text-sm text-ink-800">{teacher.subject}</dd>
              </div>
            )}
            {teacher.qualification && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Qualification</dt>
                <dd className="mt-1 text-sm text-ink-800">{teacher.qualification}</dd>
              </div>
            )}
            {teacher.email && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Email</dt>
                <dd className="mt-1 text-sm text-ink-800">
                  <a href={`mailto:${teacher.email}`} className="text-brand-600 hover:underline">{teacher.email}</a>
                </dd>
              </div>
            )}
          </dl>
          {teacher.bio && <div className="prose-html mt-6" dangerouslySetInnerHTML={{ __html: teacher.bio }} />}
        </div>
      </div>

      {colleagues.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-2xl font-semibold text-ink-950">More of our team</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {colleagues.map((t) => (
              <Link key={t.id} href={`/about/teachers/${t.slug}`} className="group flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-4 shadow-sm hover:shadow-card">
                <Avatar name={t.name} mediaId={t.photo_id} className="h-14 w-14 text-lg" />
                <div>
                  <p className="font-semibold text-ink-900 group-hover:text-brand-700">{t.name}</p>
                  <p className="text-sm text-ink-500">{t.position}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8">
            <Button href="/about/teachers" variant="outline">View all teachers</Button>
          </div>
        </div>
      )}
    </section>
  );
}
