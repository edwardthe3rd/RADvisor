import { notFound } from "next/navigation";
import SiteShell from "@/components/SiteShell";
import ItemCard from "@/components/ItemCard";
import OperatorCard from "@/components/OperatorCard";
import FilterPanel from "@/components/FilterPanel";
import { CATEGORIES, getCategory } from "@/lib/config/categories";
import {
  getDistinctBrands,
  getOperatorIdsWithEquipment,
  getOperatorsByCategory,
  searchEquipment,
} from "@/lib/data";
import { operatorMatchesSubcategoryBrowse } from "@/lib/config/operator-subcategory-match";
import {
  filtersFromSearchParams,
  hasBrowseRefinement,
} from "@/lib/search/buildQuery";
import { effectiveSort, sortOperators } from "@/lib/search/sortResults";

export const revalidate = 300;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export function generateMetadata({ params }: { params: { category: string } }) {
  const category = getCategory(params.category);
  if (!category) return {};
  return {
    title: `${category.label} rentals near Reno & Lake Tahoe`,
    description: `Compare ${category.label.toLowerCase()} rentals from local Reno–Tahoe operators.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const category = getCategory(params.category);
  if (!category) notFound();

  const filters = {
    ...filtersFromSearchParams(searchParams),
    categories: [category.slug],
  };
  const subcategories = filters.subcategories;
  const showCatalog = hasBrowseRefinement(filters);
  const [items, allOperators, brands, operatorIdsWithEquipment] = await Promise.all([
    showCatalog ? searchEquipment(filters) : Promise.resolve([]),
    getOperatorsByCategory(category.slug, {
      delivery: filters.delivery,
      location: filters.location,
    }),
    getDistinctBrands(),
    getOperatorIdsWithEquipment(category.slug, subcategories),
  ]);
  const filteredOperators =
    subcategories?.length ?
      allOperators.filter((op) =>
        operatorMatchesSubcategoryBrowse(op, subcategories, operatorIdsWithEquipment),
      )
    : allOperators;
  const { sorted: operators, distances: operatorDistances } = sortOperators(
    filteredOperators,
    filters,
  );
  const showOperatorDistance = effectiveSort(filters) === "distance";

  return (
    <SiteShell>
      <main className="mx-auto max-w-content px-4 py-8">
        <h1 className="mb-2 text-3xl font-extrabold text-ink-primary">
          {category.label}
        </h1>
        <p className="mb-6 text-ink-secondary">
          {operators.length} local operator{operators.length === 1 ? "" : "s"} in{" "}
          {category.label.toLowerCase()} across the Reno–Tahoe region. Use filters
          to narrow gear listings.
        </p>

        <FilterPanel
          filters={filters}
          brands={brands}
          resultCount={showCatalog ? items.length : operators.length}
          resultLabel={showCatalog ? "results" : "operators"}
          lockedCategory={category.slug}
        />

        {showCatalog &&
          (items.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} tier={filters.tier} />
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-lg border border-surface-borderLight bg-surface-muted p-6 text-ink-secondary">
              No gear matched these filters yet. Try broadening your filters, or
              contact the operators below directly.
            </p>
          ))}

        {operators.length > 0 && (
          <section className={showCatalog && items.length > 0 ? "mt-12" : "mt-6"}>
            <h2 className="mb-4 text-2xl font-bold text-ink-primary">
              {category.label} operators
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {operators.map((operator) => (
                <OperatorCard
                  key={operator.id}
                  operator={operator}
                  hasInventory={operatorIdsWithEquipment.has(operator.id)}
                  distanceMiles={
                    showOperatorDistance ?
                      operatorDistances.get(operator.id)
                    : undefined
                  }
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </SiteShell>
  );
}
