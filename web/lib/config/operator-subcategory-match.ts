import {
  DEMO_SUBCATEGORY_SUFFIX,
  LEASE_SUBCATEGORY_SUFFIX,
} from "@/lib/config/acquisition-types";
import type { Operator } from "@/lib/supabase/types";

export function isDemoSubcategory(subcategory: string): boolean {
  return subcategory.endsWith(DEMO_SUBCATEGORY_SUFFIX);
}

export function isLeaseSubcategory(subcategory: string): boolean {
  return subcategory.endsWith(LEASE_SUBCATEGORY_SUFFIX);
}

/** Strip a `_demo` / `_lease` acquisition suffix to the base equipment subcategory. */
function baseSubcategory(subcategory: string): string {
  if (isDemoSubcategory(subcategory)) {
    return subcategory.slice(0, -DEMO_SUBCATEGORY_SUFFIX.length);
  }
  if (isLeaseSubcategory(subcategory)) {
    return subcategory.slice(0, -LEASE_SUBCATEGORY_SUFFIX.length);
  }
  return subcategory;
}

type SubcategoryMatchOperator = Pick<
  Operator,
  "id" | "subcategories" | "offers_demo" | "offers_season_lease"
>;

/** True when a subcategory filter should include this operator without catalog rows. */
export function operatorMatchesSubcategoryBrowse(
  operator: SubcategoryMatchOperator,
  subcategories: string[] | undefined,
  operatorIdsWithEquipment: Set<string>,
): boolean {
  if (!subcategories?.length) return true;
  if (operatorIdsWithEquipment.has(operator.id)) return true;

  const owned = new Set(operator.subcategories ?? []);
  for (const sub of subcategories) {
    const base = baseSubcategory(sub);
    if (isLeaseSubcategory(sub)) {
      if (operator.offers_season_lease && owned.has(base)) return true;
      continue;
    }
    if (isDemoSubcategory(sub)) {
      if (operator.offers_demo && owned.has(base)) return true;
      continue;
    }
    if (owned.has(sub)) return true;
  }
  return false;
}
