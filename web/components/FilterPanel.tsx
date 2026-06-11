"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { CATEGORIES, categoryLabel, subcategoryLabel } from "@/lib/config/categories";
import {
  PRICE_TIER_LABELS,
  filtersToSearchParams,
  type Filters,
  type PriceTier,
} from "@/lib/search/buildQuery";
import type { SkillLevel } from "@/lib/supabase/types";
import SortControls from "./SortControls";

const SKILL_OPTIONS: SkillLevel[] = ["beginner", "intermediate", "advanced"];

/**
 * Shared advanced-filter panel (05 §3) — used by search and category listing
 * pages. All state is URL-encoded so results stay shareable; changing a
 * control updates the URL and the server re-renders the results.
 */
export default function FilterPanel({
  filters,
  brands = [],
  resultCount,
  resultLabel = "results",
  lockedCategory,
  sortMode = "browse",
}: {
  filters: Filters;
  brands?: string[];
  resultCount: number;
  resultLabel?: string;
  lockedCategory?: string;
  sortMode?: "browse" | "search";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function apply(next: Filters) {
    const params = filtersToSearchParams(next);
    router.replace(params.size ? `${pathname}?${params}` : pathname, {
      scroll: false,
    });
  }

  function toggleInList(key: "categories" | "subcategories" | "skill" | "brands", value: string) {
    const current = (filters[key] ?? []) as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    apply({ ...filters, [key]: next.length ? next : undefined });
  }

  const activeCategories = lockedCategory
    ? [lockedCategory]
    : filters.categories ?? [];
  const subcategoryOptions = CATEGORIES.filter((c) =>
    activeCategories.includes(c.slug),
  ).flatMap((c) =>
    c.subcategories.map((s) => ({ ...s, category: c.slug })),
  );

  const chips: { label: string; remove: () => void }[] = [];
  if (!lockedCategory) {
    for (const c of filters.categories ?? []) {
      chips.push({
        label: categoryLabel(c),
        remove: () => toggleInList("categories", c),
      });
    }
  }
  for (const s of filters.subcategories ?? []) {
    const parent = activeCategories.find((c) =>
      CATEGORIES.find((cat) => cat.slug === c)?.subcategories.some(
        (sub) => sub.slug === s,
      ),
    );
    chips.push({
      label: subcategoryLabel(parent ?? "", s),
      remove: () => toggleInList("subcategories", s),
    });
  }
  for (const s of filters.skill ?? []) {
    chips.push({ label: s, remove: () => toggleInList("skill", s) });
  }
  for (const b of filters.brands ?? []) {
    chips.push({ label: b, remove: () => toggleInList("brands", b) });
  }
  if (filters.priceMax !== undefined) {
    chips.push({
      label: `Under $${filters.priceMax}`,
      remove: () => apply({ ...filters, priceMax: undefined }),
    });
  }
  if (filters.hasPhoto) {
    chips.push({
      label: "Has photos",
      remove: () => apply({ ...filters, hasPhoto: undefined }),
    });
  }
  if (filters.verifiedRecently) {
    chips.push({
      label: "Recently verified",
      remove: () => apply({ ...filters, verifiedRecently: undefined }),
    });
  }
  if (filters.delivery) {
    chips.push({
      label: "Delivery service",
      remove: () => apply({ ...filters, delivery: undefined }),
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <SortControls filters={filters} mode={sortMode} />
        <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-full border border-surface-border px-4 py-1.5 text-sm font-semibold text-ink-primary hover:border-ink-primary"
        >
          Filters{chips.length > 0 ? ` (${chips.length})` : ""}
        </button>
        <span className="text-sm text-ink-secondary">
          {resultCount} {resultLabel}
        </span>
        {chips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={chip.remove}
            className="flex items-center gap-1 rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-ink-secondary hover:bg-surface-border"
          >
            {chip.label}
            <span aria-hidden="true">×</span>
          </button>
        ))}
        {chips.length > 0 && (
          <button
            type="button"
            onClick={() =>
              apply({ q: filters.q, sort: filters.sort, location: filters.location })
            }
            className="text-xs font-semibold text-ink-link hover:underline"
          >
            Clear all
          </button>
        )}
        </div>
      </div>

      {open && (
        <div className="grid gap-4 rounded-lg border border-surface-borderLight bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          {!lockedCategory && (
            <fieldset>
              <legend className="mb-1 text-sm font-bold text-ink-primary">Category</legend>
              <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                {CATEGORIES.map((c) => (
                  <label key={c.slug} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={(filters.categories ?? []).includes(c.slug)}
                      onChange={() => toggleInList("categories", c.slug)}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {subcategoryOptions.length > 0 && (
            <fieldset>
              <legend className="mb-1 text-sm font-bold text-ink-primary">Type</legend>
              <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                {subcategoryOptions.map((s) => (
                  <label key={s.slug} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={(filters.subcategories ?? []).includes(s.slug)}
                      onChange={() => toggleInList("subcategories", s.slug)}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend className="mb-1 text-sm font-bold text-ink-primary">Price</legend>
            <select
              value={filters.tier ?? "full_day"}
              onChange={(e) =>
                apply({ ...filters, tier: e.target.value as PriceTier })
              }
              className="mb-2 w-full rounded-sm border border-surface-border px-2 py-1 text-sm"
            >
              {Object.entries(PRICE_TIER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              Max $
              <input
                type="number"
                min={0}
                value={filters.priceMax ?? ""}
                onChange={(e) =>
                  apply({
                    ...filters,
                    priceMax: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-24 rounded-sm border border-surface-border px-2 py-1"
              />
            </label>
          </fieldset>

          <div className="flex flex-col gap-3">
            <fieldset>
              <legend className="mb-1 text-sm font-bold text-ink-primary">Skill level</legend>
              <div className="flex flex-col gap-1">
                {SKILL_OPTIONS.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm capitalize">
                    <input
                      type="checkbox"
                      checked={(filters.skill ?? []).includes(s)}
                      onChange={() => toggleInList("skill", s)}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </fieldset>
            {brands.length > 0 && (
              <fieldset>
                <legend className="mb-1 text-sm font-bold text-ink-primary">Brand</legend>
                <div className="flex max-h-32 flex-col gap-1 overflow-y-auto">
                  {brands.map((b) => (
                    <label key={b} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={(filters.brands ?? []).includes(b)}
                        onChange={() => toggleInList("brands", b)}
                      />
                      {b}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.hasPhoto ?? false}
                onChange={(e) =>
                  apply({ ...filters, hasPhoto: e.target.checked || undefined })
                }
              />
              Has photos
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.verifiedRecently ?? false}
                onChange={(e) =>
                  apply({
                    ...filters,
                    verifiedRecently: e.target.checked || undefined,
                  })
                }
              />
              Verified in the last 90 days
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.delivery ?? false}
                onChange={(e) =>
                  apply({
                    ...filters,
                    delivery: e.target.checked || undefined,
                  })
                }
              />
              Delivery service
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
