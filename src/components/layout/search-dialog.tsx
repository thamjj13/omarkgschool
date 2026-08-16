"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Modal } from "../ui/modal";
import { Icon } from "../ui/icon";
import { Spinner } from "../ui/primitives";

interface Result {
  type: string;
  title: string;
  url: string;
  snippet: string;
}

const TYPE_LABELS: Record<string, string> = {
  news: "News",
  program: "Program",
  event: "Event",
  teacher: "Teacher",
  faq: "FAQ",
  page: "Page",
};

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setResults([]);
      setSearched(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        const json = await res.json();
        setResults(json.data?.results ?? []);
        setSearched(true);
      } catch {
        setResults([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="relative">
        <Icon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search news, programs, events, teachers…"
          className="w-full rounded-xl border border-ink-200 bg-white py-3 pl-10 pr-10 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
        />
        {loading && <Spinner className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-500" />}
      </div>

      <div className="mt-4 max-h-[50vh] overflow-y-auto">
        {searched && results.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-400">
            No results for “{q}”. Try a different keyword.
          </p>
        )}
        {results.length > 0 && (
          <ul className="divide-y divide-ink-100">
            {results.map((r, i) => (
              <li key={i}>
                <Link
                  href={r.url}
                  onClick={onClose}
                  className="flex items-start gap-3 rounded-xl px-2 py-3 hover:bg-ink-50"
                >
                  <span className="mt-0.5 rounded-md bg-brand-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                    {TYPE_LABELS[r.type] ?? r.type}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink-900">{r.title}</span>
                    {r.snippet && <span className="mt-0.5 block text-xs text-ink-500">{r.snippet}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
