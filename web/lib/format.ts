import type { Business } from "./types";

// High-level discovery groups, in display order (mirrors the backend taxonomy
// in backend/apps/catalog/rental_taxonomy.py).
export const GROUP_ORDER = [
  "Snow",
  "Water",
  "Bike",
  "Climb",
  "Camp",
  "Vehicles",
  "E-Transport",
  "Air/Other",
] as const;

/** Coarse budget label from Google price level (0-4). */
export function priceLabel(level: number | null): string {
  if (level === null || level === undefined) return "";
  return "$".repeat(Math.max(1, Math.min(4, level + 1)));
}

export function ratingLabel(rating: string | null): string | null {
  if (!rating) return null;
  return Number(rating).toFixed(1);
}

export function locationLabel(b: Pick<Business, "city" | "state">): string {
  return [b.city, b.state].filter(Boolean).join(", ");
}

export function mapsUrl(b: Business): string {
  if (b.latitude && b.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${b.latitude},${b.longitude}`;
  }
  const q = encodeURIComponent([b.name, b.address].filter(Boolean).join(" "));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/** Slugify a group name for URLs, e.g. "E-Transport" -> "e-transport". */
export function groupToSlug(group: string): string {
  return group.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function slugToGroup(slug: string): string | null {
  return GROUP_ORDER.find((g) => groupToSlug(g) === slug) ?? null;
}

/** Order a set of present groups by the canonical order, extras alphabetical. */
export function orderGroups(present: string[]): string[] {
  const known = GROUP_ORDER.filter((g) => present.includes(g));
  const extra = present.filter((g) => !GROUP_ORDER.includes(g as never)).sort();
  return [...known, ...extra];
}
