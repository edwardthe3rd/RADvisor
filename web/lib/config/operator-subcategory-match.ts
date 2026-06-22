import type { Operator } from "@/lib/supabase/types";

type SubcategoryMatchOperator = Pick<Operator, "id" | "subcategories">;

/**
 * True when a subcategory filter should include this operator even before it
 * has catalog rows. Plain ownership match against operators.subcategories —
 * demo/lease are handled separately as operator-level flags (§3b), not suffixes.
 */
export function operatorMatchesSubcategoryBrowse(
  operator: SubcategoryMatchOperator,
  subcategories: string[] | undefined,
  operatorIdsWithEquipment: Set<string>,
): boolean {
  if (!subcategories?.length) return true;
  if (operatorIdsWithEquipment.has(operator.id)) return true;

  const owned = new Set(operator.subcategories ?? []);
  for (const sub of subcategories) {
    if (owned.has(sub)) return true;
  }
  return false;
}
