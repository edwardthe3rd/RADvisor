import Link from "next/link";
import type { Business } from "@/lib/types";
import { locationLabel, priceLabel, ratingLabel } from "@/lib/format";

export default function BusinessCard({ business }: { business: Business }) {
  const rating = ratingLabel(business.google_rating);
  const location = locationLabel(business);
  const groups = business.category_groups.slice(0, 3);
  const price = priceLabel(business.price_level);

  return (
    <Link
      href={`/business/${business.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-surface-borderLight bg-white transition hover:shadow-md"
    >
      <div className="flex h-24 items-center justify-center gap-2 bg-brand-primaryLight">
        <span className="text-3xl" aria-hidden="true">
          🏪
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="truncate font-bold text-ink-primary group-hover:text-brand-primaryDark">
          {business.name}
        </h3>
        <div className="flex items-center gap-3 text-sm text-ink-secondary">
          {rating ? (
            <span className="flex items-center gap-1">
              <span className="text-brand-tertiary" aria-hidden="true">
                ★
              </span>
              {rating}
              {business.google_rating_count > 0 ? ` (${business.google_rating_count})` : ""}
            </span>
          ) : (
            <span className="text-ink-tertiary">New</span>
          )}
          {price ? <span className="font-semibold">{price}</span> : null}
        </div>
        {location ? (
          <p className="truncate text-sm text-ink-tertiary">{location}</p>
        ) : null}
        {groups.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {groups.map((g) => (
              <span
                key={g}
                className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-secondary"
              >
                {g}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
