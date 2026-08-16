import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { MediaImg } from "@/components/media-img";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/primitives";
import { TeacherCard } from "@/components/cards";
import { StatsStrip } from "@/components/home/sections";
import { siteSettings, listTeachers, listPrograms } from "@/lib/services/site";
import { getSetting, listEnabledHomepageSections } from "@/lib/services/settings";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const s = siteSettings();
  return { title: "About Us", description: `Learn about ${s.schoolName} — our story, values and community.` };
}

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: "users", title: "Small class sizes", text: "An average of 18 students per class means every child is truly known." },
  { icon: "graduation", title: "Specialist teachers", text: "Subject experts who inspire from Early Years through the IB Diploma." },
  { icon: "shield", title: "Safe, caring campus", text: "A secure, welcoming environment with a dedicated wellbeing team." },
  { icon: "flask", title: "STEAM & innovation", text: "Robotics, coding and a makerspace that turn ideas into reality." },
  { icon: "globe", title: "Global outlook", text: "Three modern languages and partnerships with schools worldwide." },
  { icon: "heart", title: "Whole-child focus", text: "Character education, arts and athletics at the heart of every day." },
];

export default function AboutPage() {
  const s = siteSettings();
  const teachers = listTeachers({ featuredOnly: true }).slice(0, 4);
  const programs = listPrograms();
  const welcomeSection = listEnabledHomepageSections().find((x) => x.type === "welcome");

  const stats = [
    { value: getSetting("stats_students", "0"), label: "Students", icon: "users" as IconName },
    { value: getSetting("stats_teachers", "0"), label: "Teachers", icon: "graduation" as IconName },
    { value: getSetting("stats_graduates", "0"), label: "Graduates", icon: "target" as IconName },
    { value: getSetting("stats_awards", "0"), label: "Awards won", icon: "trophy" as IconName },
  ];

  return (
    <>
      <PageHeader
        title="About Maplebrook"
        subtitle={`Founded in ${s.foundedYear}, ${s.schoolName} has grown into a vibrant, forward-thinking learning community.`}
        crumb="about"
      />

      {/* story */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Our story</p>
            <h2 className="font-display text-3xl font-semibold text-ink-950 sm:text-4xl">
              A community built on curiosity and care
            </h2>
            <div className="prose-html mt-4 text-ink-600">
              <p>
                {s.schoolName} opened its doors in {s.foundedYear} with just three classrooms and a simple belief: that
                every child deserves an education that treats them as an individual. Today we welcome more than{" "}
                {getSetting("stats_students", "1,180")} students from Early Years to Grade 12, yet that founding belief
                remains unchanged.
              </p>
              <p>
                Our curriculum blends the best of international education with a warm, community-minded ethos. Students
                are challenged academically, encouraged creatively, and supported personally — so they leave us ready for
                university, work and life.
              </p>
              <p>
                We are proud of our graduates, who go on to leading universities and careers around the world, and of the
                strong partnership we share with parents at every step of the journey.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/about/mission">Mission & values</Button>
              <Button href="/about/principal" variant="outline">Principal's message</Button>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-3xl shadow-soft">
              <MediaImg id={welcomeSection?.media_id ?? null} alt="Life at Maplebrook" className="aspect-[4/3] w-full" />
            </div>
            <div className="absolute -bottom-5 left-6 rounded-2xl bg-white p-4 shadow-card">
              <p className="font-display text-2xl font-bold text-brand-700">{programs.length}</p>
              <p className="text-xs font-medium text-ink-500">Academic programs</p>
            </div>
          </div>
        </div>
      </section>

      <StatsStrip stats={stats} />

      {/* features */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <SectionHeading eyebrow="Why Maplebrook" title="What makes us different" subtitle="The commitments that shape every decision we make." />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Icon name={f.icon} size={22} />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink-950">{f.title}</h3>
              <p className="mt-1.5 text-sm text-ink-500">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* teachers preview */}
      {teachers.length > 0 && (
        <section className="bg-ink-50 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading align="left" eyebrow="Our people" title="Meet our teachers" subtitle="Dedicated educators who inspire every day." />
              <Button href="/about/teachers" variant="outline">View all</Button>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {teachers.map((t) => (
                <TeacherCard key={t.id} item={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 px-8 py-12 text-center text-white sm:px-16">
          <h2 className="font-display text-3xl font-semibold">Come and see for yourself</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">Our doors are always open to prospective families.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button href="/contact" size="lg" variant="accent">Book a tour</Button>
            <Button href="/admissions/apply" size="lg" variant="outline" className="border-white/25 bg-white/5 text-white hover:border-white/50 hover:text-white">
              Apply now
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
