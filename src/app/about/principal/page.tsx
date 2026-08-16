import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { MediaImg } from "@/components/media-img";
import { getTeacherBySlug, getPageBySlug } from "@/lib/services/site";
import { Avatar } from "@/components/cards";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Principal's Message", description: "A warm welcome from the Principal of Maplebrook International Academy." };
}

export default function PrincipalPage() {
  const principal = getTeacherBySlug("eleanor-vance");
  const message = getPageBySlug("principal-message");

  return (
    <>
      <PageHeader title="Principal's Message" subtitle="A warm welcome from our Principal." crumb="about" />
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[300px_1fr]">
          <div>
            {principal?.photo_id ? (
              <div className="overflow-hidden rounded-3xl shadow-soft">
                <MediaImg id={principal.photo_id} alt={principal.name} className="aspect-[3/4] w-full" eager />
              </div>
            ) : (
              <div className="flex aspect-[3/4] items-center justify-center rounded-3xl bg-gradient-to-br from-brand-100 to-accent-100">
                <Avatar name={principal?.name ?? "Principal"} className="h-28 w-28 text-3xl" />
              </div>
            )}
            <div className="mt-5 rounded-2xl border border-ink-100 bg-ink-50 p-5">
              <h2 className="font-display text-lg font-semibold text-ink-950">{principal?.name ?? "Principal"}</h2>
              <p className="text-sm font-medium text-brand-600">{principal?.position ?? "Principal"}</p>
              {principal?.qualification && <p className="mt-1 text-xs text-ink-500">{principal.qualification}</p>}
              {principal?.email && (
                <a href={`mailto:${principal.email}`} className="mt-2 block text-sm text-brand-600 hover:underline">
                  {principal.email}
                </a>
              )}
            </div>
          </div>
          <div>
            <div className="prose-html max-w-none rounded-3xl border border-ink-100 bg-white p-8 text-ink-700 sm:p-10">
              {message?.content ? (
                <div dangerouslySetInnerHTML={{ __html: message.content }} />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: principal?.bio ?? "<p>Welcome to Maplebrook.</p>" }} />
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
