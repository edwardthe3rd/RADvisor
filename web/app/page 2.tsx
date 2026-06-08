import Link from "next/link";
import { getBusinesses, getCategories } from "@/lib/api";
import { groupToSlug, orderGroups } from "@/lib/format";
import SiteHeader from "@/components/SiteHeader";
import BusinessCard from "@/components/BusinessCard";
import type { Business } from "@/lib/types";

async function loadHome() {
  try {
    const [businesses, categories] = await Promise.all([
      getBusinesses(),
      getCategories(),
    ]);
    return { businesses, categories };
  } catch {
    // Degrade gracefully if the API is briefly unavailable during a build/ISR
    // pass; the page revalidates and refills on the next request.
    return { businesses: [], categories: [] };
  }
}

export default async function HomePage() {
  const { businesses, categories } = await loadHome();

  const grouped: Record<string, Business[]> = {};
  for (const b of businesses) {
    const groups = b.category_groups.length > 0 ? b.category_groups : ["Air/Other"];
    for (const g of groups) {
      (grouped[g] ||= []).push(b);
    }
  }
  const groups = orderGroups(Object.keys(grouped));

  const groupCategories: Record<string, typeof categories> = {};
  for (const c of categories) {
    if (!c.group) continue;
    (groupCategories[c.group] ||= []).push(c);
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-content px-4 py-8">
        <section className="mb-10">
          <h1 className="text-3xl font-extrabold text-ink-primary sm:text-4xl">
            Outdoor gear rentals near Reno &amp; Lake Tahoe
          </h1>
          <p className="mt-2 max-w-2xl text-lg text-ink-secondary">
            Discover local businesses renting skis, kayaks, bikes, camping gear,
            RVs and more. Browse by category or search for what you need.
          </p>
        </section>

        {businesses.length === 0 ? (
          <p className="rounded-lg border border-surface-borderLight bg-surface-muted p-6 text-ink-secondary">
            No rental businesses yet. Run the Reno business sync on the backend to
            populate the directory.
          </p>
        ) : (
          groups.map((group) => (
            <section key={group} className="mb-12">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-ink-primary">{group}</h2>
                <Link
                  href={`/category/${groupToSlug(group)}`}
                  className="text-sm font-semibold text-ink-link hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {grouped[group].slice(0, 8).map((b) => (
                  <BusinessCard key={`${group}-${b.id}`} business={b} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </>
  );
}
