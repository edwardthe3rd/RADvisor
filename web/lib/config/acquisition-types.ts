// Non-purchase ways to access gear. Rentals use activity categories in
// categories.ts; demos use gear_demos. Future types (subscription, lease, etc.)
// get their own category slugs here when we list them.

import { CATEGORIES, type CategorySlug } from "./categories";

export interface AcquisitionType {
  slug: string;
  label: string;
  description: string;
  categorySlugs: readonly CategorySlug[];
}

const RENTAL_CATEGORY_SLUGS = CATEGORIES.filter((c) => c.slug !== "gear_demos").map(
  (c) => c.slug,
) as CategorySlug[];

export const ACQUISITION_TYPES = [
  {
    slug: "rental",
    label: "Rentals",
    description: "Pay to use gear for a set period.",
    categorySlugs: RENTAL_CATEGORY_SLUGS,
  },
  {
    slug: "demo",
    label: "Demos & tryouts",
    description: "Try before you buy — factory, shop, or on-mountain demo programs.",
    categorySlugs: ["gear_demos"],
  },
] as const satisfies readonly AcquisitionType[];
