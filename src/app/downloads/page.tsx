import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/primitives";
import { fileSize } from "@/lib/utils";
import { listDocumentsPublic } from "@/lib/services/site";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Downloads", description: "Downloadable documents from Maplebrook International Academy." };
}

export default function DownloadsPage() {
  const docs = listDocumentsPublic();

  return (
    <>
      <PageHeader title="Downloads" subtitle="Prospectuses, policies, calendars and forms." crumb="downloads" />
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-3">
          {docs.length > 0 ? (
            docs.map((d) => (
              <div key={d.id} className="flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-sm transition-all hover:border-brand-200 hover:shadow-card">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <Icon name="file-text" size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-base font-semibold text-ink-950">{d.title}</h2>
                    {d.category && <Badge tone="slate">{d.category}</Badge>}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-ink-500">
                    {d.original_name} · {fileSize(d.size_bytes)}
                  </p>
                  {d.description && <p className="mt-1 text-xs text-ink-400">{d.description}</p>}
                </div>
                <a
                  href={`/api/downloads/${d.id}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition-colors hover:bg-brand-700"
                  aria-label={`Download ${d.title}`}
                >
                  <Icon name="download" size={18} />
                </a>
              </div>
            ))
          ) : (
            <p className="text-center text-ink-500">No documents available yet.</p>
          )}
        </div>
      </section>
    </>
  );
}
