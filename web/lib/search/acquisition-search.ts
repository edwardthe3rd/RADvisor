import { CATEGORIES } from "@/lib/config/categories";
import {
  DEMO_SUBCATEGORY_SUFFIX,
  LEASE_SUBCATEGORY_SUFFIX,
} from "@/lib/config/acquisition-types";
import type { Filters } from "@/lib/search/buildQuery";

const DEMO_QUERY =
  /\b(demos?|tryouts?|try[\s-]?outs?|try before you buy)\b/gi;
const LEASE_QUERY =
  /\b(leases?|season[\s-]?leases?|full[\s-]?season|seasonal[\s-]?(?:lease|rental)s?)\b/gi;

export interface AcquisitionSearchIntent {
  demo: boolean;
  lease: boolean;
  /** Remaining keyword text after stripping acquisition terms. */
  textQuery: string;
  subcategories: string[];
}

function subcategoriesWithSuffix(suffix: string): string[] {
  return CATEGORIES.flatMap((c) =>
    c.subcategories.filter((s) => s.slug.endsWith(suffix)).map((s) => s.slug),
  );
}

const DEMO_SUBCATEGORIES = subcategoriesWithSuffix(DEMO_SUBCATEGORY_SUFFIX);
const LEASE_SUBCATEGORIES = subcategoriesWithSuffix(LEASE_SUBCATEGORY_SUFFIX);

export function parseAcquisitionSearchQuery(q: string): AcquisitionSearchIntent {
  const demo = DEMO_QUERY.test(q);
  DEMO_QUERY.lastIndex = 0;
  const lease = LEASE_QUERY.test(q);
  LEASE_QUERY.lastIndex = 0;

  const textQuery = q
    .replace(DEMO_QUERY, " ")
    .replace(LEASE_QUERY, " ")
    .replace(/\s+/g, " ")
    .trim();

  const subcategories = [
    ...(demo ? DEMO_SUBCATEGORIES : []),
    ...(lease ? LEASE_SUBCATEGORIES : []),
  ];

  return { demo, lease, textQuery, subcategories };
}

/** Merge demo/lease intent from `q` into browse/search filters. */
export function applyAcquisitionToFilters(filters: Filters): Filters {
  if (!filters.q?.trim()) return filters;

  const intent = parseAcquisitionSearchQuery(filters.q);
  if (!intent.demo && !intent.lease) return filters;

  const subcategories = Array.from(
    new Set([...(filters.subcategories ?? []), ...intent.subcategories]),
  );

  return {
    ...filters,
    subcategories: subcategories.length ? subcategories : filters.subcategories,
    q: intent.textQuery || undefined,
  };
}

export function acquisitionSearchLabel(intent: AcquisitionSearchIntent): string | null {
  if (intent.demo && intent.lease) return "Demos & season leases";
  if (intent.demo) return "Demos & tryouts";
  if (intent.lease) return "Season leases";
  return null;
}
