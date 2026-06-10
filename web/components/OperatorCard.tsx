import Link from "next/link";
import type { Operator } from "@/lib/supabase/types";
import { categoryLabel } from "@/lib/config/categories";
import { locationLabel, ratingLabel, formatDistance } from "@/lib/format";

export default function OperatorCard({
  operator,
  distanceMiles,
  hasInventory = true,
}: {
  operator: Operator;
  distanceMiles?: number;
  /**
   * Whether this operator has any cataloged equipment (overall, or in the
   * current category context). When false, show a contact-forward empty
   * state instead of implying there's nothing to rent (03 §2a).
   */
  hasInventory?: boolean;
}) {
  const rating = ratingLabel(operator.rating_external);
  const location = locationLabel(operator);
  const categories = (operator.categories ?? []).slice(0, 3);
  const photo = operator.logo_url ?? operator.photos?.[0] ?? null;
  const telHref = operator.phone
    ? `tel:${operator.phone.replace(/[^+\d]/g, "")}`
    : null;

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-surface-borderLight bg-white transition hover:shadow-md">
      <Link href={`/operators/${operator.slug}`} className="flex flex-col">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={operator.name}
            className="h-24 w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-24 items-center justify-center gap-2 bg-brand-primaryLight">
            <span className="text-3xl" aria-hidden="true">
              🏪
            </span>
          </div>
        )}
        <div className="flex flex-col gap-1 p-3 pb-0">
          <h3 className="truncate font-bold text-ink-primary group-hover:text-brand-primaryDark">
            {operator.name}
          </h3>
          <div className="flex items-center gap-3 text-sm text-ink-secondary">
            {rating ? (
              <span className="flex items-center gap-1">
                <span className="text-brand-tertiary" aria-hidden="true">
                  ★
                </span>
                {rating}
                {operator.rating_external_count
                  ? ` (${operator.rating_external_count})`
                  : ""}
                <span className="text-xs text-ink-tertiary">Google</span>
              </span>
            ) : (
              <span className="text-ink-tertiary">Not yet rated</span>
            )}
            {distanceMiles !== undefined && (
              <span>{formatDistance(distanceMiles)}</span>
            )}
          </div>
          {location ? (
            <p className="truncate text-sm text-ink-tertiary">{location}</p>
          ) : null}
          {categories.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {categories.map((slug) => (
                <span
                  key={slug}
                  className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-secondary"
                >
                  {categoryLabel(slug)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3 pt-2">
        {!hasInventory && (
          <p className="rounded-md bg-brand-primaryLight px-2 py-1.5 text-xs font-semibold text-ink-primary">
            Unable to provide inventory — please contact {operator.name}{" "}
            directly.
          </p>
        )}

        <div className="mt-auto flex flex-wrap gap-2">
          {operator.booking_url && (
            <a
              href={operator.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-brand-primary px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-brand-primaryDark"
            >
              Book online
            </a>
          )}
          {telHref && (
            <a
              href={telHref}
              className="rounded-md border border-ink-primary px-2.5 py-1.5 text-xs font-bold text-ink-primary transition hover:bg-surface-muted"
            >
              Call {operator.phone}
            </a>
          )}
          {operator.website && (
            <a
              href={operator.website}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-surface-border px-2.5 py-1.5 text-xs font-semibold text-ink-primary transition hover:bg-surface-muted"
            >
              Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
