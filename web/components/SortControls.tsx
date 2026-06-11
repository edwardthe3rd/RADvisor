"use client";

import { usePathname, useRouter } from "next/navigation";
import { REGION_SPOTS } from "@/lib/config/locations";
import {
  BROWSE_SORT_OPTIONS,
  SEARCH_SORT_OPTIONS,
} from "@/lib/search/sortResults";
import {
  filtersToSearchParams,
  type Filters,
  type SortOption,
} from "@/lib/search/buildQuery";

export default function SortControls({
  filters,
  mode = "browse",
}: {
  filters: Filters;
  mode?: "browse" | "search";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const options = mode === "search" ? SEARCH_SORT_OPTIONS : BROWSE_SORT_OPTIONS;
  const current =
    filters.sort ?? (mode === "search" ? "relevance" : "distance");
  const showLocation =
    current === "distance" || filters.location !== undefined;

  function apply(next: Filters) {
    const params = filtersToSearchParams(next);
    router.replace(params.size ? `${pathname}?${params}` : pathname, {
      scroll: false,
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-2 text-sm text-ink-secondary">
        <span className="font-semibold text-ink-primary">Sort</span>
        <select
          value={current}
          onChange={(e) => {
            const sort = e.target.value as SortOption;
            const next: Filters = { ...filters, sort };
            if (sort !== "distance") {
              next.location = undefined;
            } else if (!next.location) {
              next.location = "reno";
            }
            apply(next);
          }}
          className="rounded-sm border border-surface-border bg-white px-2 py-1.5 text-sm text-ink-primary"
          aria-label="Sort results"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {showLocation && (
        <label className="flex items-center gap-2 text-sm text-ink-secondary">
          <span className="font-semibold text-ink-primary">Near</span>
          <select
            value={filters.location ?? "reno"}
            onChange={(e) =>
              apply({
                ...filters,
                location: e.target.value,
                sort: filters.sort ?? "distance",
              })
            }
            className="max-w-[11rem] rounded-sm border border-surface-border bg-white px-2 py-1.5 text-sm text-ink-primary sm:max-w-none"
            aria-label="Sort distance from location"
          >
            {REGION_SPOTS.map((spot) => (
              <option key={spot.slug} value={spot.slug}>
                {spot.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
