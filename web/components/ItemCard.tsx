import Link from "next/link";
import CategoryIcon from "./CategoryIcon";
import FreshnessNote from "./FreshnessNote";
import type { EquipmentWithOperator } from "@/lib/data";
import { getCategory } from "@/lib/config/categories";
import { pickPrice, priceWithSuffix, formatDistance } from "@/lib/format";
import type { PriceTier } from "@/lib/search/buildQuery";

/**
 * The shared equipment card (03 §4) — reused by discovery, search, and
 * questionnaire results. Image, name, brand/model, operator, starting price,
 * freshness note.
 */
export default function ItemCard({
  item,
  tier = "full_day",
  distanceMiles,
}: {
  item: EquipmentWithOperator;
  tier?: PriceTier;
  distanceMiles?: number;
}) {
  const category = getCategory(item.category);
  const price = pickPrice(item, tier);

  return (
    <Link
      href={`/operators/${item.operators.slug}#item-${item.id}`}
      className="group flex w-56 shrink-0 flex-col overflow-hidden rounded-lg border border-surface-borderLight bg-white transition hover:shadow-md sm:w-auto"
    >
      {item.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image_url}
          alt={item.name ?? "Rental equipment"}
          className="h-32 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-32 items-center justify-center bg-brand-primaryLight">
          <CategoryIcon icon={category?.icon ?? "mountain"} className="text-4xl" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 font-bold text-ink-primary group-hover:text-brand-primaryDark">
          {item.name ?? category?.label ?? "Rental item"}
        </h3>
        {(item.brand || item.model) && (
          <p className="truncate text-sm text-ink-secondary">
            {[item.brand, item.model].filter(Boolean).join(" ")}
          </p>
        )}
        <p className="truncate text-sm text-ink-tertiary">
          {item.operators.name}
          {distanceMiles !== undefined ? ` · ${formatDistance(distanceMiles)}` : ""}
        </p>
        <div className="mt-auto flex items-baseline justify-between pt-1">
          {price ? (
            <span className="font-semibold text-ink-primary">
              {priceWithSuffix(price.value, price.tier)}
              {price.isFallback && (
                <span className="ml-1 text-xs font-normal text-ink-tertiary">
                  (closest rate)
                </span>
              )}
            </span>
          ) : (
            <span className="text-sm text-ink-tertiary">Contact for pricing</span>
          )}
        </div>
        <FreshnessNote lastVerified={item.last_verified} />
      </div>
    </Link>
  );
}
