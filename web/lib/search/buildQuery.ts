// Centralized query construction (instructions/05 §5): search, browse, and
// the questionnaire all build Supabase equipment queries from one Filters
// shape so refinement hands off cleanly between flows.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SkillLevel } from "@/lib/supabase/types";
import { applyAcquisitionToFilters } from "@/lib/search/acquisition-search";

export type PriceTier =
  | "hourly"
  | "half_day"
  | "full_day"
  | "multi_day"
  | "weekly"
  | "season";

export const PRICE_TIER_COLUMNS: Record<PriceTier, string> = {
  hourly: "price_hourly",
  half_day: "price_half_day",
  full_day: "price_full_day",
  multi_day: "price_multi_day",
  weekly: "price_weekly",
  season: "price_weekly",
};

export const PRICE_TIER_LABELS: Record<PriceTier, string> = {
  hourly: "Hourly",
  half_day: "Half day",
  full_day: "Full day",
  multi_day: "Multi-day (per day)",
  weekly: "Weekly",
  season: "Full season",
};

export type SortOption =
  | "relevance"
  | "popular"
  | "price_asc"
  | "price_desc"
  | "distance"
  | "verified"
  | "rating"
  | "alpha";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "distance", label: "Nearest" },
  { value: "popular", label: "Popular" },
  { value: "alpha", label: "A–Z" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
  { value: "verified", label: "Recently verified" },
  { value: "relevance", label: "Relevance" },
];

const SORT_VALUES = new Set(SORT_OPTIONS.map((o) => o.value));

/** Restore to `"popular"` after operator/seed fine-tuning (05 §4). */
export const DEFAULT_BROWSE_SORT: SortOption = "alpha";
export const DEFAULT_SEARCH_SORT: SortOption = "relevance";

export function resolveSort(filters: Filters): SortOption {
  if (filters.sort) return filters.sort;
  return filters.q ? DEFAULT_SEARCH_SORT : DEFAULT_BROWSE_SORT;
}

export interface Filters {
  q?: string;
  categories?: string[];
  subcategories?: string[];
  skill?: SkillLevel[];
  tier?: PriceTier;
  priceMin?: number;
  priceMax?: number;
  brands?: string[];
  operatorIds?: string[];
  hasPhoto?: boolean;
  verifiedRecently?: boolean;
  /** When true, only operators that offer gear delivery. */
  delivery?: boolean;
  /** When true, only operators flagged offers_demo (§3b). Set from query intent. */
  demo?: boolean;
  /** When true, only operators flagged offers_season_lease (§3b). Set from query intent. */
  lease?: boolean;
  /** Spot slug from lib/config/locations.ts — proximity sort, never a hard filter. */
  location?: string;
  sort?: SortOption;
}

const ARRAY_KEYS = [
  "categories",
  "subcategories",
  "skill",
  "brands",
  "operatorIds",
] as const;

/** Decode filters from URL search params (shareable/bookmarkable state, 05 §3). */
export function filtersFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): Filters {
  const get = (k: string): string | undefined => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const list = (k: string): string[] | undefined => {
    const v = get(k);
    return v ? v.split(",").filter(Boolean) : undefined;
  };
  const num = (k: string): number | undefined => {
    const v = get(k);
    const n = v ? Number(v) : NaN;
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    q: get("q") || undefined,
    categories: list("categories"),
    subcategories: list("subcategories"),
    skill: list("skill") as SkillLevel[] | undefined,
    tier: (get("tier") as PriceTier) || undefined,
    priceMin: num("priceMin"),
    priceMax: num("priceMax"),
    brands: list("brands"),
    operatorIds: list("operatorIds"),
    hasPhoto: get("hasPhoto") === "1" || undefined,
    verifiedRecently: get("verified") === "1" || undefined,
    delivery: get("delivery") === "1" || undefined,
    location: get("location") || undefined,
    sort: SORT_VALUES.has(get("sort") as SortOption)
      ? (get("sort") as SortOption)
      : undefined,
  };
}

/** True when the user narrowed beyond a category landing page (03 §2). */
export function hasBrowseRefinement(filters: Filters): boolean {
  return !!(
    filters.subcategories?.length ||
    filters.skill?.length ||
    filters.brands?.length ||
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined ||
    filters.hasPhoto ||
    filters.verifiedRecently ||
    filters.operatorIds?.length ||
    filters.delivery
  );
}

export function filtersToSearchParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  for (const key of ARRAY_KEYS) {
    const v = filters[key];
    if (v?.length) params.set(key, v.join(","));
  }
  if (filters.tier) params.set("tier", filters.tier);
  if (filters.priceMin !== undefined) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax !== undefined) params.set("priceMax", String(filters.priceMax));
  if (filters.hasPhoto) params.set("hasPhoto", "1");
  if (filters.verifiedRecently) params.set("verified", "1");
  if (filters.delivery) params.set("delivery", "1");
  if (filters.location) params.set("location", filters.location);
  if (filters.sort) params.set("sort", filters.sort);
  return params;
}

export const OPERATOR_SUMMARY =
  "id, name, slug, city, state, lat, lng, phone, website, booking_url, rating_external, rating_external_count, offers_demo, offers_rental" as const;

export const EQUIPMENT_WITH_OPERATOR = `*, operators!inner(${OPERATOR_SUMMARY})` as const;

function escapeLike(term: string): string {
  return term.replace(/[%_,()]/g, " ").trim();
}

/**
 * Build the equipment query for a Filters shape. Distance sorting happens
 * post-query in JS (~hundreds of rows at launch volume, 04 §4).
 */
export function buildEquipmentQuery(
  db: SupabaseClient<Database>,
  filters: Filters,
) {
  const effective = applyAcquisitionToFilters(filters);

  let query = db
    .from("equipment")
    .select(EQUIPMENT_WITH_OPERATOR)
    .eq("is_active", true);

  if (effective.categories?.length) query = query.in("category", effective.categories);
  if (effective.subcategories?.length)
    query = query.in("subcategory", effective.subcategories);
  if (effective.skill?.length)
    query = query.in("skill_level", [...effective.skill, "all"]);
  if (effective.brands?.length) query = query.in("brand", effective.brands);
  if (effective.operatorIds?.length)
    query = query.in("operator_id", effective.operatorIds);
  if (effective.delivery) query = query.eq("operators.offers_delivery", true);
  if (effective.demo) query = query.eq("operators.offers_demo", true);
  if (effective.lease) query = query.eq("operators.offers_season_lease", true);
  if (effective.hasPhoto) query = query.not("image_url", "is", null);
  if (effective.verifiedRecently) {
    const cutoff = new Date(Date.now() - 90 * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);
    query = query.gte("last_verified", cutoff);
  }

  const tierColumn = PRICE_TIER_COLUMNS[effective.tier ?? "full_day"];
  if (effective.tier !== "season") {
    if (effective.priceMin !== undefined) query = query.gte(tierColumn, effective.priceMin);
    if (effective.priceMax !== undefined) query = query.lte(tierColumn, effective.priceMax);
  }

  if (effective.q) {
    const term = escapeLike(effective.q);
    if (term) {
      query = query.or(
        `name.ilike.%${term}%,brand.ilike.%${term}%,model.ilike.%${term}%,category.ilike.%${term}%,subcategory.ilike.%${term}%`,
      );
    }
  }

  switch (resolveSort(effective)) {
    case "price_asc":
      query = query.order(tierColumn, { ascending: true, nullsFirst: false });
      break;
    case "price_desc":
      query = query.order(tierColumn, { ascending: false, nullsFirst: false });
      break;
    case "verified":
      query = query.order("last_verified", { ascending: false, nullsFirst: false });
      break;
    case "alpha":
      query = query.order("name", { ascending: true });
      break;
    case "popular":
      query = query.order("is_popular", { ascending: false });
      break;
    // distance, rating, relevance: callers re-rank in JS after fetch.
    default:
      query = query.order("name", { ascending: true });
  }

  return query;
}

/** Operator name search for the "operators matching your query" strip (05 §2). */
export function buildOperatorSearchQuery(
  db: SupabaseClient<Database>,
  q: string,
  filters: Pick<Filters, "delivery"> = {},
) {
  const term = escapeLike(q);
  let query = db
    .from("operators")
    .select(OPERATOR_SUMMARY)
    .eq("is_active", true)
    .or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  if (filters.delivery) query = query.eq("offers_delivery", true);
  return query.limit(20);
}
