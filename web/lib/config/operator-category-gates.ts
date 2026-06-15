/**
 * Operators whose category tags only apply when the user is targeting a
 * specific spot (questionnaire / distance sort location picker).
 */
export const CATEGORY_LOCATION_GATES: Record<
  string,
  Partial<Record<string, readonly string[]>>
> = {
  // Serene Lakes residents only — gate every category it appears in.
  "donner-ski-shop": {
    snow_sports: ["serene-lakes"],
    water_sports: ["serene-lakes"],
  },
};

export function operatorVisibleForCategoryBrowse(
  operator: { slug: string; categories?: string[] | null },
  category: string,
  location?: string,
): boolean {
  if (!(operator.categories ?? []).includes(category)) return false;
  const required = CATEGORY_LOCATION_GATES[operator.slug]?.[category];
  if (!required) return true;
  return !!location && required.includes(location);
}
