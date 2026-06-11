import {
  DEMO_ONLY_NAME_SUFFIX,
  DEMO_ONLY_OPERATOR_SLUGS,
} from "@/lib/config/demo-operators";
import type { Equipment, Operator } from "@/lib/supabase/types";
import { PRICE_TIER_COLUMNS, type PriceTier } from "@/lib/search/buildQuery";

export function operatorDisplayName(
  operator: Pick<Operator, "name" | "slug">,
): string {
  if (!DEMO_ONLY_OPERATOR_SLUGS.has(operator.slug)) return operator.name;
  if (operator.name.endsWith(DEMO_ONLY_NAME_SUFFIX)) return operator.name;
  return `${operator.name}${DEMO_ONLY_NAME_SUFFIX}`;
}

export function formatPrice(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return `$${Number(value) % 1 === 0 ? Number(value) : Number(value).toFixed(2)}`;
}

const TIER_SUFFIX: Record<PriceTier, string> = {
  hourly: "/hr",
  half_day: "/half day",
  full_day: "/day",
  multi_day: "/day (multi)",
  weekly: "/week",
};

/**
 * Resolve the price to display for a chosen tier, falling back to the next
 * available tier (04 §3 Step 4 — note the fallback to the user).
 */
export function pickPrice(
  item: Equipment,
  tier: PriceTier = "full_day",
): { value: number; tier: PriceTier; isFallback: boolean } | null {
  const order: PriceTier[] = [
    tier,
    "full_day",
    "multi_day",
    "half_day",
    "weekly",
    "hourly",
  ];
  for (const t of order) {
    const value = item[PRICE_TIER_COLUMNS[t] as keyof Equipment] as number | null;
    if (value !== null && value !== undefined) {
      return { value: Number(value), tier: t, isFallback: t !== tier };
    }
  }
  return null;
}

export function priceWithSuffix(value: number, tier: PriceTier): string {
  return `${formatPrice(value)}${TIER_SUFFIX[tier]}`;
}

/** Freshness rule (03 §5): stale when last_verified is over 90 days old. */
export function isStale(lastVerified: string | null): boolean {
  if (!lastVerified) return true;
  const age = Date.now() - new Date(lastVerified).getTime();
  return age > 90 * 24 * 3600 * 1000;
}

export function ratingLabel(rating: number | null): string | null {
  if (rating === null || rating === undefined) return null;
  return Number(rating).toFixed(1);
}

export function locationLabel(
  o: Pick<Operator, "city" | "state">,
): string {
  return [o.city, o.state].filter(Boolean).join(", ");
}

export function mapsUrl(o: Operator): string {
  if (o.lat && o.lng) {
    return `https://www.google.com/maps/search/?api=1&query=${o.lat},${o.lng}`;
  }
  const q = encodeURIComponent([o.name, o.address].filter(Boolean).join(" "));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function formatDistance(miles: number): string {
  return miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles)} mi`;
}
