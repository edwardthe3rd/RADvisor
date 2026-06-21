// Canonical category taxonomy (instructions/01_data_model.md §3).
// Static config, not a DB table — referenced by slug everywhere.

export interface Subcategory {
  slug: string;
  label: string;
}

export interface Category {
  slug: string;
  label: string;
  icon: string;
  subcategories: readonly Subcategory[];
}

export const CATEGORIES = [
  {
    slug: "snow_sports",
    label: "Snow Sports",
    icon: "snowflake",
    // Subcategory = discipline; gear type (ski/boots/poles/beacon/etc.) lives in
    // equipment.attributes.gear_type. Demos & season leases are attributes.rental_type
    // (not subcategories). Searchable attribute vocabulary: instructions/extraction/snow_sports.md.
    subcategories: [
      { slug: "alpine_ski", label: "Alpine Skis" },
      { slug: "backcountry_ski", label: "Backcountry / Touring Skis" },
      { slug: "telemark_ski", label: "Telemark Skis" },
      { slug: "cross_country_ski", label: "Cross-Country Skis" },
      { slug: "snowboard", label: "Snowboards" },
      { slug: "splitboard", label: "Splitboards" },
      { slug: "snowshoe", label: "Snowshoes" },
      { slug: "sled", label: "Sleds & Tubes" },
      { slug: "snowmobile", label: "Snowmobiles" }, // motorized snow; off_road is the summer powersports bucket
      { slug: "timbersled", label: "Snow Bikes (Timbersled)" }, // motorized dirt bike + snowmobile track kit
      { slug: "apparel_snow", label: "Snow Apparel" },
      { slug: "avalanche_safety", label: "Avalanche Safety Gear" },
    ],
  },
  {
    slug: "mountain_biking",
    label: "Mountain Biking",
    icon: "bike",
    subcategories: [
      { slug: "mountain_bike", label: "Mountain Bike" },
      { slug: "ebike_mtb", label: "E-MTB" },
      { slug: "fat_bike", label: "Fat Bike" }, // incl. fat-tire "snow bikes" (human/e-assist); winter `fat_bike` activity

      // Demo variants (try-before-you-buy). Matched via offers_demo + base tag.
      { slug: "mountain_bike_demo", label: "Mountain Bike Demo" },
      { slug: "ebike_mtb_demo", label: "E-MTB Demo" },
    ],
  },
  {
    slug: "road_cycling",
    label: "Road & Gravel Cycling",
    icon: "bike",
    subcategories: [
      { slug: "road_bike", label: "Performance Road Bike" },
      { slug: "gravel_bike", label: "Gravel Bike" },
      { slug: "ebike", label: "E-Bike" },
      { slug: "cruiser_bike", label: "Cruiser Bike" },
      { slug: "tandem_bike", label: "Tandem Bike" },
      { slug: "kids_bike", label: "Kids Bike" },
      // Accessories — shown as chips but don't drive browse-category membership.
      { slug: "bike_trailer", label: "Bike Trailer" },
      { slug: "bike_rack", label: "Bike Rack" },
      // Demo variants (try-before-you-buy). Matched via offers_demo + base tag.
      { slug: "road_bike_demo", label: "Performance Road Bike Demo" },
      { slug: "gravel_bike_demo", label: "Gravel Bike Demo" },
    ],
  },
  {
    slug: "burning_man_bikes",
    label: "Burning Man Bikes",
    icon: "bike",
    subcategories: [{ slug: "playa_bike", label: "Playa Bikes" }],
  },
  {
    slug: "water_sports",
    label: "Water Sports",
    icon: "waves",
    subcategories: [
      { slug: "kayak", label: "Kayaks" },
      { slug: "canoe", label: "Canoes" },
      { slug: "paddleboard", label: "Paddleboards (SUP)" },
      { slug: "raft", label: "Rafts" },
      { slug: "jet_ski", label: "Jet Skis / PWC" },
      { slug: "wakeboard", label: "Wakeboards & Water Skis" },
      { slug: "wetsuit", label: "Wetsuits & Gear" },
      { slug: "boat", label: "Boats" },
    ],
  },
  {
    slug: "camping",
    label: "Camping & Backpacking",
    icon: "tent",
    subcategories: [
      { slug: "tent", label: "Tents" },
      { slug: "sleep_system", label: "Sleeping Bags & Pads" },
      { slug: "backpack", label: "Backpacks" },
      { slug: "cooking", label: "Camp Kitchen & Stoves" },
      { slug: "camp_furniture", label: "Camp Furniture" },
      { slug: "full_kit", label: "Complete Camp Kits" },
    ],
  },
  {
    slug: "off_road",
    label: "Off-Road & Powersports",
    icon: "mountain",
    subcategories: [
      { slug: "atv", label: "ATVs" },
      { slug: "utv", label: "UTVs / Side-by-Sides" },
      { slug: "dirt_bike", label: "Dirt Bikes" },
      // Off-road is the SUMMER powersports category. Snowmobiles/timbersleds live in
      // snow_sports; operators doing both are cross-tagged via the `snowmobile` activity.
    ],
  },
  {
    slug: "motorcycles",
    label: "Motorcycles",
    icon: "bike",
    subcategories: [
      { slug: "street_moto", label: "Street Motorcycles" },
      { slug: "adventure_moto", label: "Adventure / Dual-Sport" },
    ],
  },
  {
    slug: "rock_climbing",
    label: "Rock Climbing",
    icon: "mountain",
    subcategories: [
      { slug: "climbing_shoes", label: "Climbing Shoes" },
      { slug: "harness", label: "Harnesses" },
      { slug: "rope_hardware", label: "Ropes & Hardware" },
      { slug: "crash_pad", label: "Crash Pads" },
      { slug: "full_climbing_kit", label: "Complete Climbing Kits" },
    ],
  },
  {
    slug: "electric_transport",
    label: "Electric Transportation",
    icon: "zap",
    subcategories: [
      { slug: "ebike", label: "E-Bike" },
      { slug: "ebike_mtb", label: "E-MTB" },
      { slug: "e_scooter", label: "Electric Scooter" },
      { slug: "onewheel", label: "Onewheel / EUC" },
    ],
  },
  {
    slug: "winter_other",
    label: "Other Winter",
    icon: "snowflake",
    // Avalanche safety consolidated under snow_sports.avalanche_safety so the filter
    // facet isn't split across two categories (see instructions/extraction/snow_sports.md §0).
    subcategories: [
      { slug: "ice_skates", label: "Ice Skates" },
    ],
  },
  {
    slug: "aerial",
    label: "Aerial Adventures",
    icon: "wind",
    subcategories: [
      { slug: "paraglider", label: "Paragliding Gear" },
      { slug: "wingsuit", label: "Wingsuits" },
    ],
  },
  {
    // Holding bucket for active operators that have no gear tags yet. Derived
    // (see getOperatorsByCategory / getOperatorCategoryCounts in lib/data.ts) —
    // an operator is "in" this category when its subcategories array is empty,
    // and drops out automatically the moment it gets tagged. Keeps un-tagged
    // operators discoverable without showing misleading category chips.
    slug: "uncategorized",
    label: "Uncategorized",
    icon: "tag",
    subcategories: [],
  },
] as const satisfies readonly Category[];

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function categoryLabel(slug: string): string {
  return getCategory(slug)?.label ?? slug;
}

export function subcategoryLabel(category: string, sub: string): string {
  return (
    getCategory(category)?.subcategories.find((s) => s.slug === sub)?.label ??
    subcategoryLabelGlobal(sub)
  );
}

/**
 * Resolve a subcategory tag label by slug across all categories. Bike tags
 * (e.g. ebike, ebike_mtb) are intentionally cross-category, so the operator
 * page can label a tag without knowing which browse category it came from.
 */
export function subcategoryLabelGlobal(sub: string): string {
  for (const c of CATEGORIES) {
    const found = c.subcategories.find((s) => s.slug === sub);
    if (found) return found.label;
  }
  return sub;
}
