import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBusiness, getBusinesses, ApiError } from "@/lib/api";
import {
  locationLabel,
  mapsUrl,
  priceLabel,
  ratingLabel,
} from "@/lib/format";
import SiteHeader from "@/components/SiteHeader";
import type { Business } from "@/lib/types";

export const revalidate = 3600;
// Allow detail pages for businesses not captured at build time (ISR on-demand).
export const dynamicParams = true;

interface Params {
  params: { slug: string };
}

export async function generateStaticParams() {
  // Resilient: if the API is unreachable at build time, fall back to on-demand
  // ISR (dynamicParams = true) instead of failing the build.
  try {
    const businesses = await getBusinesses();
    return businesses.map((b) => ({ slug: b.slug }));
  } catch {
    return [];
  }
}

async function loadBusiness(slug: string): Promise<Business | null> {
  try {
    return await getBusiness(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const business = await loadBusiness(params.slug);
  if (!business) return {};
  const location = locationLabel(business);
  const cats = business.categories.map((c) => c.name).join(", ");
  const title = `${business.name}${location ? ` - ${location}` : ""}`;
  const description = `${business.name} rents ${cats || "outdoor gear"}${
    location ? ` in ${location}` : ""
  }. Hours, contact info, ratings and directions.`;
  return {
    title,
    description,
    alternates: { canonical: `/business/${business.slug}` },
    openGraph: { title, description, type: "website" },
  };
}

function jsonLd(business: Business, siteUrl: string) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    url: `${siteUrl}/business/${business.slug}`,
  };
  if (business.address) data.address = business.address;
  if (business.phone) data.telephone = business.phone;
  if (business.website) data.sameAs = business.website;
  if (business.latitude && business.longitude) {
    data.geo = {
      "@type": "GeoCoordinates",
      latitude: business.latitude,
      longitude: business.longitude,
    };
  }
  if (business.google_rating && business.google_rating_count > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: business.google_rating,
      reviewCount: business.google_rating_count,
    };
  }
  return data;
}

export default async function BusinessDetailPage({ params }: Params) {
  const business = await loadBusiness(params.slug);
  if (!business) notFound();

  const rating = ratingLabel(business.google_rating);
  const location = locationLabel(business);
  const price = priceLabel(business.price_level);
  const hours = (business.hours as { weekday?: string[] })?.weekday ?? [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return (
    <>
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(business, siteUrl)) }}
      />
      <main className="mx-auto max-w-content px-4 py-8">
        <nav className="mb-4 text-sm text-ink-tertiary">
          <a href="/" className="hover:underline">
            Home
          </a>{" "}
          / <span className="text-ink-secondary">{business.name}</span>
        </nav>

        <div className="mb-6 flex h-40 items-center justify-center rounded-lg bg-brand-primaryLight">
          <span className="text-5xl" aria-hidden="true">
            🏪
          </span>
        </div>

        <h1 className="text-3xl font-extrabold text-ink-primary">{business.name}</h1>

        <div className="mt-2 flex flex-wrap items-center gap-4 text-ink-secondary">
          {rating ? (
            <span className="flex items-center gap-1 font-semibold">
              <span className="text-brand-tertiary" aria-hidden="true">
                ★
              </span>
              {rating}
              {business.google_rating_count > 0
                ? ` · ${business.google_rating_count} reviews`
                : ""}
            </span>
          ) : null}
          {price ? <span className="font-semibold">{price}</span> : null}
        </div>

        <div className="mt-5">
          <Link
            href={`/reserve/${business.slug}`}
            className="inline-block rounded-full bg-brand-primary px-6 py-3 font-semibold text-white hover:bg-brand-primaryDark"
          >
            Request to reserve
          </Link>
        </div>

        {business.categories.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {business.categories.map((c) => (
              <span
                key={c.id}
                className="rounded-full bg-surface-muted px-3 py-1 text-sm font-medium text-ink-secondary"
              >
                {c.icon ? `${c.icon} ` : ""}
                {c.name}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-surface-borderLight p-5">
            <h2 className="mb-3 text-lg font-bold text-ink-primary">Contact</h2>
            <ul className="space-y-3 text-ink-primary">
              {business.address ? (
                <li>
                  <span className="block text-xs text-ink-tertiary">
                    {location || "Address"}
                  </span>
                  <a
                    href={mapsUrl(business)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink-link hover:underline"
                  >
                    {business.address}
                  </a>
                </li>
              ) : null}
              {business.phone ? (
                <li>
                  <span className="block text-xs text-ink-tertiary">Phone</span>
                  <a
                    href={`tel:${business.phone.replace(/[^0-9+]/g, "")}`}
                    className="text-ink-link hover:underline"
                  >
                    {business.phone}
                  </a>
                </li>
              ) : null}
              {business.website ? (
                <li>
                  <span className="block text-xs text-ink-tertiary">Website</span>
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-words text-ink-link hover:underline"
                  >
                    {business.website.replace(/^https?:\/\//, "")}
                  </a>
                </li>
              ) : null}
              <li>
                <a
                  href={mapsUrl(business)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-link hover:underline"
                >
                  Open in Maps →
                </a>
              </li>
            </ul>
          </div>

          {hours.length > 0 ? (
            <div className="rounded-lg border border-surface-borderLight p-5">
              <h2 className="mb-3 text-lg font-bold text-ink-primary">Hours</h2>
              <ul className="space-y-1 text-sm text-ink-secondary">
                {hours.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <p className="mt-8 text-center text-xs text-ink-tertiary">
          Info sourced from Google. Contact the business directly to confirm
          availability and pricing.
        </p>
      </main>
    </>
  );
}
