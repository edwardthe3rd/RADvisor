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
}

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

  return { demo, lease, textQuery };
}

/**
 * Merge demo/lease intent from `q` into filters as operator-level flags
 * (operators.offers_demo / offers_season_lease). This is the high-recall,
 * cross-category signal — see instructions/01_data_model.md §3b.
 */
export function applyAcquisitionToFilters(filters: Filters): Filters {
  if (!filters.q?.trim()) return filters;

  const intent = parseAcquisitionSearchQuery(filters.q);
  if (!intent.demo && !intent.lease) return filters;

  return {
    ...filters,
    demo: intent.demo || filters.demo,
    lease: intent.lease || filters.lease,
    q: intent.textQuery || undefined,
  };
}

export function acquisitionSearchLabel(intent: AcquisitionSearchIntent): string | null {
  if (intent.demo && intent.lease) return "Demos & season leases";
  if (intent.demo) return "Demos & tryouts";
  if (intent.lease) return "Season leases";
  return null;
}
