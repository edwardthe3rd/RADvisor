import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBusinesses } from "@/lib/api";
import { GROUP_ORDER, groupToSlug, slugToGroup } from "@/lib/format";
import SiteHeader from "@/components/SiteHeader";
import BusinessCard from "@/components/BusinessCard";

export const revalidate = 3600;

interface Params {
  params: { group: string };
}

export function generateStaticParams() {
  return GROUP_ORDER.map((g) => ({ group: groupToSlug(g) }));
}

export function generateMetadata({ params }: Params): Metadata {
  const group = slugToGroup(params.group);
  if (!group) return {};
  const title = `${group} gear rentals near Reno & Lake Tahoe`;
  const description = `Browse ${group.toLowerCase()} equipment rental businesses in the Reno and Lake Tahoe area.`;
  return {
    title,
    description,
    alternates: { canonical: `/category/${params.group}` },
    openGraph: { title, description },
  };
}

export default async function CategoryPage({ params }: Params) {
  const group = slugToGroup(params.group);
  if (!group) notFound();

  let businesses: Awaited<ReturnType<typeof getBusinesses>> = [];
  try {
    businesses = await getBusinesses({ category_group: group });
  } catch {
    // Degrade gracefully; ISR will refill when the API is reachable.
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-content px-4 py-8">
        <nav className="mb-4 text-sm text-ink-tertiary">
          <a href="/" className="hover:underline">
            Home
          </a>{" "}
          / <span className="text-ink-secondary">{group}</span>
        </nav>
        <h1 className="mb-2 text-3xl font-extrabold text-ink-primary">
          {group} rentals
        </h1>
        <p className="mb-8 text-ink-secondary">
          {businesses.length} {businesses.length === 1 ? "business" : "businesses"} near
          Reno &amp; Lake Tahoe
        </p>

        {businesses.length === 0 ? (
          <p className="rounded-lg border border-surface-borderLight bg-surface-muted p-6 text-ink-secondary">
            No businesses in this category yet.
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
