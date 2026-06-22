// Non-purchase ways to access gear. Rentals, demos, and season leases share
// activity categories (e.g. snow_sports); demos and leases are distinguished by
// the operator-level flags offers_demo / offers_season_lease (see
// instructions/01_data_model.md §3b), not by subcategory variants.

import { CATEGORIES, type CategorySlug } from "./categories";

export interface AcquisitionType {
  slug: string;
  label: string;
  description: string;
  categorySlugs: readonly CategorySlug[];
}

export const ACQUISITION_TYPES = [
  {
    slug: "rental",
    label: "Rentals",
    description: "Pay to use gear for a set period.",
    categorySlugs: CATEGORIES.map((c) => c.slug),
  },
  {
    slug: "demo",
    label: "Demos & tryouts",
    description:
      "Try before you buy — operators flagged offers_demo. Search “demo” to filter.",
    categorySlugs: CATEGORIES.map((c) => c.slug),
  },
  {
    slug: "lease",
    label: "Season leases",
    description:
      "Full-season gear programs — operators flagged offers_season_lease. Search “season lease” to filter.",
    categorySlugs: CATEGORIES.map((c) => c.slug),
  },
] as const satisfies readonly AcquisitionType[];
