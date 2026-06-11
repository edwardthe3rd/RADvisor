import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import FreshnessNote from "@/components/FreshnessNote";
import CategoryIcon from "@/components/CategoryIcon";
import { categoryLabel, getCategory, subcategoryLabel } from "@/lib/config/categories";
import { getOperatorBySlug } from "@/lib/data";
import {
  locationLabel,
  mapsUrl,
  pickPrice,
  priceWithSuffix,
  ratingLabel,
} from "@/lib/format";
import type { Equipment } from "@/lib/supabase/types";

export const revalidate = 300;

const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const data = await getOperatorBySlug(params.slug);
  if (!data) return {};
  const { operator } = data;
  return {
    title: `${operator.name} — gear rentals in ${locationLabel(operator) || "Reno–Tahoe"}`,
    description:
      operator.description ??
      `Rental gear, pricing and contact info for ${operator.name}.`,
  };
}

export default async function OperatorPage({
  params,
}: {
  params: { slug: string };
}) {
  const data = await getOperatorBySlug(params.slug);
  if (!data) notFound();
  const { operator, equipment } = data;

  const rating = ratingLabel(operator.rating_external);
  const hours =
    operator.hours && typeof operator.hours === "object" && !Array.isArray(operator.hours)
      ? (operator.hours as Record<string, string>)
      : null;

  const byCategory = new Map<string, Equipment[]>();
  for (const item of equipment) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-content px-4 py-8">
        <nav className="mb-4 text-sm text-ink-tertiary">
          <Link href="/" className="hover:underline">
            Discover
          </Link>
          {" / "}
          <span className="text-ink-secondary">{operator.name}</span>
        </nav>

        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-extrabold text-ink-primary">
              {operator.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-secondary">
              {rating && (
                <span className="flex items-center gap-1">
                  <span className="text-brand-gold" aria-hidden="true">
                    ★
                  </span>
                  {rating}
                  {operator.rating_external_count
                    ? ` (${operator.rating_external_count})`
                    : ""}
                  <span className="text-xs text-ink-tertiary">on Google</span>
                </span>
              )}
              {locationLabel(operator) && <span>{locationLabel(operator)}</span>}
            </div>
            {(operator.categories ?? []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {(operator.categories ?? []).map((slug) => (
                  <Link
                    key={slug}
                    href={`/discover/${slug}`}
                    className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-secondary hover:bg-surface-border"
                  >
                    {categoryLabel(slug)}
                  </Link>
                ))}
              </div>
            )}
            {operator.description && (
              <p className="mt-4 max-w-2xl text-ink-secondary">
                {operator.description}
              </p>
            )}
            <FreshnessNote lastVerified={operator.last_verified} />

            <section className="mt-10">
              <h2 className="mb-4 text-2xl font-bold text-ink-primary">
                Rental inventory
              </h2>
              {equipment.length === 0 ? (
                <p className="rounded-lg border border-surface-borderLight bg-brand-secondaryLight p-6 font-semibold text-ink-primary">
                  Unable to provide inventory — please contact {operator.name}{" "}
                  directly. They rent{" "}
                  {(operator.categories ?? [])
                    .map((c) => categoryLabel(c).toLowerCase())
                    .join(", ") || "outdoor gear"}
                  — use the contact info{" "}
                  <span className="lg:hidden">above</span>
                  <span className="hidden lg:inline">to the right</span> to
                  confirm availability.
                </p>
              ) : (
                Array.from(byCategory.entries()).map(([category, items]) => (
                  <div key={category} className="mb-8">
                    <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-ink-primary">
                      <CategoryIcon
                        icon={getCategory(category)?.icon ?? "mountain"}
                        className="text-xl"
                      />
                      {categoryLabel(category)}
                    </h3>
                    <ul className="divide-y divide-surface-borderLight rounded-lg border border-surface-borderLight bg-white">
                      {items.map((item) => {
                        const price = pickPrice(item);
                        return (
                          <li
                            key={item.id}
                            id={`item-${item.id}`}
                            className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-ink-primary">
                                {item.name ??
                                  subcategoryLabel(category, item.subcategory ?? "")}
                              </p>
                              <p className="text-sm text-ink-tertiary">
                                {[item.brand, item.model, item.size]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                              <FreshnessNote lastVerified={item.last_verified} />
                            </div>
                            <div className="text-right">
                              {price ? (
                                <p className="font-semibold text-ink-primary">
                                  {priceWithSuffix(price.value, price.tier)}
                                </p>
                              ) : (
                                <p className="text-sm text-ink-tertiary">
                                  Contact for pricing
                                </p>
                              )}
                              {item.quantity_available === null && (
                                <p className="text-xs text-ink-tertiary">
                                  Availability unknown — contact to confirm
                                </p>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </section>
          </div>

          <aside
            className={`w-full shrink-0 lg:w-80 ${
              equipment.length === 0 ? "order-first lg:order-none" : ""
            }`}
          >
            <div className="sticky top-20 rounded-lg border border-surface-borderLight bg-white p-5">
              <h2 className="mb-3 text-lg font-bold text-ink-primary">
                Contact to confirm availability
              </h2>
              <div className="flex flex-col gap-2">
                {operator.booking_url && (
                  <a
                    href={operator.booking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-brand-primary px-4 py-2.5 text-center font-bold text-white transition hover:bg-brand-primaryDark"
                  >
                    Book online
                  </a>
                )}
                {operator.phone && (
                  <a
                    href={`tel:${operator.phone.replace(/[^+\d]/g, "")}`}
                    className="rounded-lg border border-ink-primary px-4 py-2.5 text-center font-bold text-ink-primary transition hover:bg-surface-muted"
                  >
                    Call {operator.phone}
                  </a>
                )}
                {operator.website && (
                  <a
                    href={operator.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-surface-border px-4 py-2.5 text-center font-semibold text-ink-primary transition hover:bg-surface-muted"
                  >
                    Visit website
                  </a>
                )}
                <a
                  href={mapsUrl(operator)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center text-sm font-semibold text-ink-link hover:underline"
                >
                  {operator.address ?? "View on map"}
                </a>
              </div>

              {hours && Object.keys(hours).length > 0 && (
                <div className="mt-5">
                  <h3 className="mb-2 text-sm font-bold text-ink-primary">Hours</h3>
                  <dl className="space-y-1 text-sm text-ink-secondary">
                    {Object.entries(DAY_LABELS).map(([key, label]) =>
                      hours[key] ? (
                        <div key={key} className="flex justify-between gap-3">
                          <dt>{label}</dt>
                          <dd className="text-right">{hours[key]}</dd>
                        </div>
                      ) : null,
                    )}
                  </dl>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
