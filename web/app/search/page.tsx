import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import ItemCard from "@/components/ItemCard";
import FilterPanel from "@/components/FilterPanel";
import { getDistinctBrands, searchEquipment, searchOperators } from "@/lib/data";
import { filtersFromSearchParams } from "@/lib/search/buildQuery";
import { locationLabel, operatorDisplayName } from "@/lib/format";

export const metadata = {
  title: "Search gear rentals",
  description:
    "Search outdoor gear rentals across every operator in the Reno–Tahoe region.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = filtersFromSearchParams(searchParams);
  const [items, operators, brands] = await Promise.all([
    searchEquipment(filters),
    filters.q ? searchOperators(filters.q, filters) : Promise.resolve([]),
    getDistinctBrands(),
  ]);

  return (
    <SiteShell search={filters.q}>
      <main className="mx-auto max-w-content px-4 py-8">
        <h1 className="mb-6 text-2xl font-extrabold text-ink-primary">
          {filters.q ? `Results for “${filters.q}”` : "Search gear"}
        </h1>

        <FilterPanel
          filters={filters}
          brands={brands}
          resultCount={items.length}
          sortMode="search"
        />

        {operators.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-lg font-bold text-ink-primary">
              Rental shops matching your search
            </h2>
            <div className="flex flex-wrap gap-2">
              {operators.map((op) => (
                <Link
                  key={op.id}
                  href={`/operators/${op.slug}`}
                  className="rounded-full border border-surface-border px-4 py-2 text-sm font-semibold text-ink-primary hover:border-brand-gold hover:text-brand-goldDark"
                >
                  {operatorDisplayName(op)}
                  {locationLabel(op) ? (
                    <span className="ml-1 font-normal text-ink-tertiary">
                      · {locationLabel(op)}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        )}

        {items.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} tier={filters.tier} />
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-lg border border-surface-borderLight bg-surface-muted p-6 text-ink-secondary">
            {filters.q
              ? "No gear matched your search. Try a broader term, or "
              : "No gear listings match these filters yet. "}
            <Link href="/" className="font-semibold text-ink-link hover:underline">
              browse operators by category
            </Link>{" "}
            to find shops that carry what you need.
          </p>
        )}
      </main>
    </SiteShell>
  );
}
