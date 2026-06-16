// Server-side data fetch helpers. All consumer reads go through the anon
// client (RLS: active rows only). Failures return empty data so pages render
// an honest empty state rather than crashing.

import { supabaseServer } from "@/lib/supabase/server";
import type { Equipment, Operator } from "@/lib/supabase/types";
import {
  buildEquipmentQuery,
  buildOperatorSearchQuery,
  OPERATOR_SUMMARY,
  type Filters,
} from "@/lib/search/buildQuery";
import { parseAcquisitionSearchQuery } from "@/lib/search/acquisition-search";
import { operatorVisibleForCategoryBrowse } from "@/lib/config/operator-category-gates";
import { sortEquipment } from "@/lib/search/sortResults";

export type OperatorSummary = Pick<
  Operator,
  | "id"
  | "name"
  | "slug"
  | "city"
  | "state"
  | "lat"
  | "lng"
  | "phone"
  | "website"
  | "booking_url"
  | "rating_external"
  | "rating_external_count"
  | "offers_demo"
  | "offers_rental"
>;

export type EquipmentWithOperator = Equipment & { operators: OperatorSummary };

/** Active operator count per category slug (category grid, 03 §2). */
export async function getOperatorCategoryCounts(): Promise<Map<string, number>> {
  const db = supabaseServer();
  const { data, error } = await db
    .from("operators")
    .select("slug, categories, subcategories")
    .eq("is_active", true);
  if (error || !data) return new Map();
  const counts = new Map<string, number>();
  for (const row of data) {
    // Active operators with no gear tags yet are grouped under the derived
    // "uncategorized" browse category so they stay discoverable without
    // showing a misleading category chip on their card.
    if (!(row.subcategories?.length)) {
      counts.set("uncategorized", (counts.get("uncategorized") ?? 0) + 1);
    }
    for (const c of row.categories ?? []) {
      if (!operatorVisibleForCategoryBrowse(row, c)) continue;
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
  }
  return counts;
}

/** Active equipment count per category slug. */
export async function getEquipmentCategoryCounts(): Promise<Map<string, number>> {
  const db = supabaseServer();
  const { data, error } = await db
    .from("equipment")
    .select("category")
    .eq("is_active", true);
  if (error || !data) return new Map();
  const counts = new Map<string, number>();
  for (const row of data) {
    counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
  }
  return counts;
}

/** All popular items in one query, grouped client-side (03 §4). */
export async function getPopularEquipment(): Promise<EquipmentWithOperator[]> {
  const db = supabaseServer();
  const { data, error } = await db
    .from("equipment")
    .select("*, operators!inner(id, name, slug, city, state, lat, lng, phone, website, booking_url, rating_external, rating_external_count)")
    .eq("is_active", true)
    .eq("is_popular", true)
    .limit(200);
  if (error || !data) return [];
  return data as unknown as EquipmentWithOperator[];
}

export async function searchEquipment(
  filters: Filters,
  limit = 100,
): Promise<EquipmentWithOperator[]> {
  const db = supabaseServer();
  const { data, error } = await buildEquipmentQuery(db, filters).limit(limit);
  if (error || !data) return [];
  return sortEquipment(data as unknown as EquipmentWithOperator[], filters);
}

export async function searchOperators(
  q: string,
  filters: Pick<Filters, "delivery"> = {},
): Promise<OperatorSummary[]> {
  const db = supabaseServer();
  const intent = parseAcquisitionSearchQuery(q);
  const byId = new Map<string, OperatorSummary>();

  const add = (rows: OperatorSummary[] | null | undefined) => {
    for (const row of rows ?? []) byId.set(row.id, row);
  };

  if (intent.textQuery) {
    const { data, error } = await buildOperatorSearchQuery(
      db,
      intent.textQuery,
      filters,
    );
    if (!error) add(data);
  }

  if (intent.demo) {
    let demoFlag = db
      .from("operators")
      .select(OPERATOR_SUMMARY)
      .eq("is_active", true)
      .eq("offers_demo", true);
    if (filters.delivery) demoFlag = demoFlag.eq("offers_delivery", true);
    const { data: demoFlagRows, error: demoFlagError } = await demoFlag.order(
      "name",
      { ascending: true },
    );
    if (!demoFlagError) add(demoFlagRows);

    let demoDesc = db
      .from("operators")
      .select(OPERATOR_SUMMARY)
      .eq("is_active", true)
      .ilike("description", "%demo%");
    if (filters.delivery) demoDesc = demoDesc.eq("offers_delivery", true);
    const { data: demoDescRows, error: demoDescError } = await demoDesc.order(
      "name",
      { ascending: true },
    );
    if (!demoDescError) add(demoDescRows);
  }

  if (intent.lease) {
    let flagged = db
      .from("operators")
      .select(OPERATOR_SUMMARY)
      .eq("is_active", true)
      .eq("offers_season_lease", true);
    if (filters.delivery) flagged = flagged.eq("offers_delivery", true);
    const { data: flaggedRows, error: flaggedError } = await flagged.order(
      "name",
      { ascending: true },
    );
    if (!flaggedError) add(flaggedRows);

    let leaseDesc = db
      .from("operators")
      .select(OPERATOR_SUMMARY)
      .eq("is_active", true)
      .or("description.ilike.%lease%,name.ilike.%lease%");
    if (filters.delivery) leaseDesc = leaseDesc.eq("offers_delivery", true);
    const { data: descRows, error: descError } = await leaseDesc.order("name", {
      ascending: true,
    });
    if (!descError) add(descRows);
  }

  return Array.from(byId.values());
}

export async function getOperatorsByCategory(
  category: string,
  options: Pick<Filters, "delivery" | "location"> = {},
): Promise<Operator[]> {
  const db = supabaseServer();
  // "uncategorized" is a derived bucket: active operators with no gear tags
  // yet (empty subcategories), regardless of which categories they're in.
  if (category === "uncategorized") {
    let q = db.from("operators").select("*").eq("is_active", true);
    if (options.delivery) q = q.eq("offers_delivery", true);
    const { data, error } = await q.order("name", { ascending: true });
    if (error || !data) return [];
    return data.filter((op) => !(op.subcategories?.length));
  }
  let query = db
    .from("operators")
    .select("*")
    .eq("is_active", true)
    .contains("categories", [category]);
  if (options.delivery) query = query.eq("offers_delivery", true);
  const { data, error } = await query.order("name", { ascending: true });
  if (error || !data) return [];
  return data.filter((op) =>
    operatorVisibleForCategoryBrowse(op, category, options.location),
  );
}

/** Operators with verified full-season lease programs in a category. */
export async function getSeasonLeaseOperatorsByCategory(
  category: string,
  options: Pick<Filters, "delivery" | "location"> = {},
): Promise<Operator[]> {
  const db = supabaseServer();
  let query = db
    .from("operators")
    .select("*")
    .eq("is_active", true)
    .eq("offers_season_lease", true)
    .contains("categories", [category]);
  if (options.delivery) query = query.eq("offers_delivery", true);
  const { data, error } = await query.order("name", { ascending: true });
  if (error || !data) return [];
  return data.filter((op) =>
    operatorVisibleForCategoryBrowse(op, category, options.location),
  );
}

/**
 * Operator IDs that have at least one active equipment row in the given
 * category. Used so category pages can flag operators with no cataloged
 * inventory and surface a contact-forward state instead (03 §2a).
 */
export async function getOperatorIdsWithEquipment(
  category: string,
  subcategories?: string[],
): Promise<Set<string>> {
  const db = supabaseServer();
  let query = db
    .from("equipment")
    .select("operator_id")
    .eq("is_active", true)
    .eq("category", category);
  if (subcategories?.length) {
    query = query.in("subcategory", subcategories);
  }
  const { data, error } = await query;
  if (error || !data) return new Set();
  return new Set(data.map((row) => row.operator_id));
}

export async function getOperatorBySlug(slug: string): Promise<{
  operator: Operator;
  equipment: Equipment[];
} | null> {
  const db = supabaseServer();
  const { data: operator, error } = await db
    .from("operators")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !operator) return null;
  const { data: equipment } = await db
    .from("equipment")
    .select("*")
    .eq("operator_id", operator.id)
    .eq("is_active", true)
    .order("category");
  return { operator, equipment: equipment ?? [] };
}

export async function getAllOperatorSlugs(): Promise<
  { slug: string; updated_at: string | null }[]
> {
  const db = supabaseServer();
  const { data, error } = await db
    .from("operators")
    .select("slug, updated_at")
    .eq("is_active", true);
  if (error || !data) return [];
  return data;
}

/** Distinct brand list for the filter panel (cached per request). */
export async function getDistinctBrands(): Promise<string[]> {
  const db = supabaseServer();
  const { data, error } = await db
    .from("equipment")
    .select("brand")
    .eq("is_active", true)
    .not("brand", "is", null);
  if (error || !data) return [];
  return Array.from(new Set(data.map((r) => r.brand as string))).sort();
}
