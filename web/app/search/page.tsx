import type { Metadata } from "next";
import { getBusinesses } from "@/lib/api";
import SiteHeader from "@/components/SiteHeader";
import BusinessCard from "@/components/BusinessCard";

interface SearchParams {
  searchParams: { q?: string };
}

export function generateMetadata({ searchParams }: SearchParams): Metadata {
  const q = searchParams.q?.trim();
  return {
    title: q ? `Search: ${q}` : "Search rentals",
    description: q
      ? `Outdoor gear rental businesses matching "${q}" near Reno & Lake Tahoe.`
      : "Search outdoor gear rental businesses near Reno & Lake Tahoe.",
    robots: { index: false },
  };
}

export default async function SearchPage({ searchParams }: SearchParams) {
  const q = searchParams.q?.trim() ?? "";
  // Server-render results so they are shareable; data itself is dynamic per query.
  const businesses = q ? await getBusinesses({ search: q }) : [];

  return (
    <>
      <SiteHeader search={q} />
      <main className="mx-auto max-w-content px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-ink-primary">
          {q ? `Results for “${q}”` : "Search rentals"}
        </h1>
        <p className="mb-8 text-ink-secondary">
          {q
            ? `${businesses.length} ${businesses.length === 1 ? "business" : "businesses"} found`
            : "Type a search above to find rental businesses."}
        </p>

        {q && businesses.length === 0 ? (
          <p className="rounded-lg border border-surface-borderLight bg-surface-muted p-6 text-ink-secondary">
            No businesses match “{q}”. Try a different term.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {businesses.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
