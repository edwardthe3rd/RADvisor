// Non-purchase ways to access gear. Rentals, demos, and season leases share
// activity categories (e.g. snow_sports); demos and leases are distinguished
// by subcategory slugs ending in _demo or _lease when the user narrows search.

import { CATEGORIES, type CategorySlug } from "./categories";

export interface AcquisitionType {
  slug: string;
  label: string;
  description: string;
  categorySlugs: readonly CategorySlug[];
}

export const DEMO_SUBCATEGORY_SUFFIX = "_demo";
export const LEASE_SUBCATEGORY_SUFFIX = "_lease";

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
      "Try before you buy — filter by a demo subcategory (e.g. Alpine Ski Demo).",
    categorySlugs: CATEGORIES.map((c) => c.slug),
  },
  {
    slug: "lease",
    label: "Season leases",
    description:
      "Full-season gear programs — filter by a lease subcategory (e.g. Season Ski Lease).",
    categorySlugs: CATEGORIES.map((c) => c.slug),
  },
] as const satisfies readonly AcquisitionType[];
