import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchClient } from "@/components/search-client";
import { Spinner } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Search", description: "Search the Maplebrook International Academy website." };
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Spinner className="text-brand-600" />
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
