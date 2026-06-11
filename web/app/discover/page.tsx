import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import CategoryCard from "@/components/CategoryCard";
import ItemCard from "@/components/ItemCard";
import { CATEGORIES } from "@/lib/config/categories";
import {
  getOperatorCategoryCounts,
  getPopularEquipment,
  type EquipmentWithOperator,
} from "@/lib/data";

export const revalidate = 300;

export const metadata = {
  title: "Discover gear rentals near Reno & Lake Tahoe",
  description:
    "Browse outdoor gear rentals by category — skis, kayaks, bikes, camping gear, RVs and more from local Reno–Tahoe rental operators.",
};

export default async function DiscoverPage() {
  const [operatorCounts, popular] = await Promise.all([
    getOperatorCategoryCounts(),
    getPopularEquipment(),
  ]);

  // One query for all popular items, grouped in memory (03 §4).
  const popularByCategory = new Map<string, EquipmentWithOperator[]>();
  for (const item of popular) {
    const list = popularByCategory.get(item.category) ?? [];
    if (list.length < 10) list.push(item);
    popularByCategory.set(item.category, list);
  }

  // Category cards show operator counts; hide categories with none.
  const visibleCategories = CATEGORIES.map((category) => {
    const operators = operatorCounts.get(category.slug) ?? 0;
    return { category, operators };
  }).filter(({ operators }) => operators > 0);

  return (
    <SiteShell>
      <main className="mx-auto max-w-content px-4 py-8">
        <section className="mb-10 rounded-xl bg-hero-lake px-6 py-10 text-center sm:py-14">
          <h1 className="text-balance text-3xl font-extrabold text-ink-primary sm:text-4xl">
            Find the right gear for your next adventure
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-lg text-ink-secondary">
            Every outdoor rental operator within 50 miles of Lake Tahoe — paddleboards,
            e-bikes, camping gear, climbing gear, UTVs and more.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/find"
              className="w-full rounded-lg bg-brand-primarySoft/90 px-6 py-3 font-bold text-white transition hover:bg-brand-primarySoftDark/95 sm:w-auto"
            >
              Take the quiz
            </Link>
            <Link
              href="/search"
              className="w-full rounded-lg border border-brand-secondary bg-surface-background px-6 py-3 font-bold text-brand-secondary transition hover:bg-white sm:w-auto"
            >
              Advanced search
            </Link>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold text-ink-primary">
            Browse by category
          </h2>
          {visibleCategories.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {visibleCategories.map(({ category, operators }) => (
                <CategoryCard
                  key={category.slug}
                  category={category}
                  count={operators}
                  countLabel="operators"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-feedback-warning/30 bg-brand-primaryLight p-6 text-ink-secondary">
              <p className="font-semibold text-ink-primary">
                No operator data loaded
              </p>
              <p className="mt-2 text-sm">
                Check{" "}
                <code className="rounded bg-white px-1">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
                and{" "}
                <code className="rounded bg-white px-1">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY
                </code>{" "}
                in <code className="rounded bg-white px-1">web/.env.local</code>{" "}
                (paste keys directly — no angle brackets), then restart{" "}
                <code className="rounded bg-white px-1">npm run dev</code>.
              </p>
            </div>
          )}
        </section>

        {CATEGORIES.filter((c) => popularByCategory.has(c.slug)).map(
          (category) => (
            <section key={category.slug} className="mb-12">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-ink-primary">
                  Popular in {category.label}
                </h2>
                <Link
                  href={`/discover/${category.slug}`}
                  className="text-sm font-semibold text-ink-link hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-5">
                {(popularByCategory.get(category.slug) ?? [])
                  .slice(0, 5)
                  .map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
              </div>
            </section>
          ),
        )}
      </main>
    </SiteShell>
  );
}
