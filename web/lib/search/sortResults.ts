import { REGION_CENTER, haversineMiles } from "@/lib/config/geo";
import { REGION_SPOTS } from "@/lib/config/locations";
import { pickPrice } from "@/lib/format";
import type { Equipment, Operator } from "@/lib/supabase/types";
import { resolveSort, type Filters, type SortOption } from "./buildQuery";

type SortableEquipment = Equipment & {
  operators: Pick<
    Operator,
    "lat" | "lng" | "rating_external" | "rating_external_count"
  >;
};

export function resolveSortPoint(filters: Filters): { lat: number; lng: number } {
  const spot = REGION_SPOTS.find((s) => s.slug === filters.location);
  return spot ?? REGION_CENTER;
}

/** Effective sort including browse/search defaults (05 §4). */
export function effectiveSort(filters: Filters): SortOption {
  return resolveSort(filters);
}

function operatorDistance(
  op: { lat: number | null; lng: number | null },
  origin: { lat: number; lng: number },
): number {
  if (op.lat == null || op.lng == null) return Infinity;
  return haversineMiles(origin, { lat: op.lat, lng: op.lng });
}

export function sortEquipment<T extends SortableEquipment>(
  items: T[],
  filters: Filters,
): T[] {
  const sort = effectiveSort(filters);
  const tier = filters.tier ?? "full_day";
  const origin = resolveSortPoint(filters);
  const copy = [...items];

  switch (sort) {
    case "price_asc":
      return copy.sort(
        (a, b) =>
          (pickPrice(a, tier)?.value ?? Infinity) -
          (pickPrice(b, tier)?.value ?? Infinity),
      );
    case "price_desc":
      return copy.sort(
        (a, b) =>
          (pickPrice(b, tier)?.value ?? -Infinity) -
          (pickPrice(a, tier)?.value ?? -Infinity),
      );
    case "alpha":
      return copy.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    case "verified":
      return copy.sort((a, b) =>
        (b.last_verified ?? "").localeCompare(a.last_verified ?? ""),
      );
    case "rating":
      return copy.sort(
        (a, b) =>
          (b.operators.rating_external ?? 0) - (a.operators.rating_external ?? 0) ||
          (b.operators.rating_external_count ?? 0) -
            (a.operators.rating_external_count ?? 0),
      );
    case "distance":
      return copy.sort(
        (a, b) =>
          operatorDistance(a.operators, origin) - operatorDistance(b.operators, origin),
      );
    case "popular":
      return copy.sort(
        (a, b) =>
          Number(b.is_popular) - Number(a.is_popular) ||
          (a.name ?? "").localeCompare(b.name ?? ""),
      );
    case "relevance":
    default:
      return copy;
  }
}

export function sortOperators(
  operators: Operator[],
  filters: Filters,
): { sorted: Operator[]; distances: Map<string, number> } {
  const sort = effectiveSort(filters);
  const origin = resolveSortPoint(filters);
  const distances = new Map<string, number>();
  for (const op of operators) {
    if (op.lat != null && op.lng != null) {
      distances.set(op.id, haversineMiles(origin, { lat: op.lat, lng: op.lng }));
    }
  }

  const copy = [...operators];
  switch (sort) {
    case "alpha":
      copy.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "rating":
      copy.sort(
        (a, b) =>
          (b.rating_external ?? 0) - (a.rating_external ?? 0) ||
          (b.rating_external_count ?? 0) - (a.rating_external_count ?? 0),
      );
      break;
    case "verified":
      copy.sort((a, b) =>
        (b.last_verified ?? "").localeCompare(a.last_verified ?? ""),
      );
      break;
    case "distance":
      copy.sort(
        (a, b) =>
          (distances.get(a.id) ?? Infinity) - (distances.get(b.id) ?? Infinity),
      );
      break;
    case "popular":
      copy.sort(
        (a, b) =>
          (b.rating_external ?? 0) - (a.rating_external ?? 0) ||
          (b.rating_external_count ?? 0) - (a.rating_external_count ?? 0),
      );
      break;
    case "price_asc":
    case "price_desc":
    case "relevance":
      break;
  }

  return { sorted: copy, distances };
}

/** Sort options shown in browse UI (excludes search-only relevance). */
export const BROWSE_SORT_OPTIONS = [
  { value: "distance" as const, label: "Nearest" },
  { value: "popular" as const, label: "Popular" },
  { value: "alpha" as const, label: "A–Z" },
  { value: "price_asc" as const, label: "Price: low to high" },
  { value: "price_desc" as const, label: "Price: high to low" },
  { value: "rating" as const, label: "Top rated" },
  { value: "verified" as const, label: "Recently verified" },
];

export const SEARCH_SORT_OPTIONS = [
  { value: "relevance" as const, label: "Relevance" },
  ...BROWSE_SORT_OPTIONS,
];
