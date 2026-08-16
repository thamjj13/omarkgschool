"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Icon } from "./ui/icon";
import { Spinner } from "./ui/primitives";

interface Result {
  type: string;
  title: string;
  url: string;
  snippet: string;
}

const LABELS: Record<string, string> = {
  news: "News",
  program: "Program",
  event: "Event",
  teacher: "Teacher",
  faq: "FAQ",
  page: "Page",
};

export function SearchClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function run(query: string) {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        const json = await res.json();
        setResults(json.data?.results ?? []);
        setSearched(true);
      } catch {
        setResults([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 250);
  }

  useEffect(() => {
    const initial = params.get("q") ?? "";
    setQ(initial);
    if (initial) run(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.replace(`/search?q=${encodeURIComponent(q)}`, { scroll: false });
    run(q);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <form onSubmit={onSubmit} className="relative">
        <Icon name="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search the whole website…"
          className="w-full rounded-2xl border border-ink-200 bg-white py-4 pl-12 pr-24 text-base shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
          autoFocus
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Search
        </button>
      </form>

      <div className="mt-10">
        {loading && <div className="flex justify-center py-8"><Spinner className="text-brand-600" /></div>}
        {!loading && searched && results.length === 0 && (
          <p className="py-8 text-center text-ink-500">No results found. Try different keywords.</p>
        )}
        {!loading && results.length > 0 && (
          <>
            <p className="mb-4 text-sm text-ink-400">{results.length} result{results.length === 1 ? "" : "s"}</p>
            <ul className="divide-y divide-ink-100">
              {results.map((r, i) => (
                <li key={i}>
                  <Link href={r.url} className="block rounded-xl px-2 py-4 hover:bg-ink-50">
                    <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">{LABELS[r.type] ?? r.type}</span>
                    <h2 className="mt-1 font-display text-lg font-semibold text-ink-950">{r.title}</h2>
                    {r.snippet && <p className="mt-1 text-sm text-ink-500">{r.snippet}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
