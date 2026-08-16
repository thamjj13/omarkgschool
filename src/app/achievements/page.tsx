import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { MediaImg } from "@/components/media-img";
import { Icon } from "@/components/ui/icon";
import { Badge, SectionHeading } from "@/components/ui/primitives";
import { formatDate } from "@/lib/utils";
import { listAchievements, listAwards } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Achievements & Awards", description: "Student achievements and school recognitions at Maplebrook International Academy." };
}

export default function AchievementsPage() {
  const achievements = listAchievements();
  const awards = listAwards();

  return (
    <>
      <PageHeader
        title="Achievements & Awards"
        subtitle="Celebrating the accomplishments of our students, teams and school community."
        crumb="achievements"
      />

      <section className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading align="left" eyebrow="Student achievements" title="Moments to be proud of" />
        {achievements.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {achievements.map((a) => (
              <article key={a.id} className="group flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-card">
                <div className="relative aspect-[16/10] overflow-hidden bg-ink-100">
                  {a.image_id ? (
                    <MediaImg id={a.image_id} alt={a.title} thumb className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-100 to-accent-100 text-brand-500">
                      <Icon name="trophy" size={40} />
                    </div>
                  )}
                  {a.category && <span className="absolute left-3 top-3"><Badge tone="brand">{a.category}</Badge></span>}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-lg font-semibold leading-snug text-ink-950">{a.title}</h3>
                  {a.student_name && <p className="mt-1 text-sm font-medium text-brand-600">{a.student_name}</p>}
                  {a.description && (
                    <div className="prose-html mt-2 flex-1 text-sm" dangerouslySetInnerHTML={{ __html: a.description }} />
                  )}
                  {a.achievement_date && (
                    <time className="mt-3 text-xs text-ink-400">{formatDate(a.achievement_date)}</time>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-ink-500">Achievements will appear here.</p>
        )}
      </section>

      {awards.length > 0 && (
        <section className="bg-ink-50 py-16">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeading align="left" eyebrow="Recognition" title="Awards & honours" />
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {awards.map((a) => (
                <div key={a.id} className="flex gap-5 rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
                    <Icon name="award" size={26} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink-950">{a.title}</h3>
                    <p className="mt-1 text-sm text-ink-500">{a.description}</p>
                    <p className="mt-2 text-xs font-medium text-ink-400">
                      {a.awarder} · {a.award_year}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
