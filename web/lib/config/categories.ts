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
    subcategories: [
      { slug: "alpine_ski", label: "Alpine Skis" },
      { slug: "alpine_ski_demo", label: "Alpine Ski Demo" },
      { slug: "snowboard", label: "Snowboards" },
      { slug: "cross_country_ski", label: "Cross-Country Skis" },
      { slug: "splitboard", label: "Splitboards" },
      { slug: "snowshoe", label: "Snowshoes" },
      { slug: "sled", label: "Sleds & Tubes" },
      { slug: "apparel_snow", label: "Snow Apparel" },
    ],
  },
  {
    slug: "mountain_biking",
    label: "Mountain Biking",
    icon: "bike",
    subcategories: [
      { slug: "xc_bike", label: "Cross-Country Bikes" },
      { slug: "trail_bike", label: "Trail Bikes" },
      { slug: "enduro_bike", label: "Enduro Bikes" },
      { slug: "downhill_bike", label: "Downhill Bikes" },
      { slug: "ebike_mtb", label: "Electric MTBs" },
      { slug: "kids_bike", label: "Kids Bikes" },
    ],
  },
  {
    slug: "road_cycling",
    label: "Road & Gravel Cycling",
    icon: "bike",
    subcategories: [
      { slug: "road_bike", label: "Road Bikes" },
      { slug: "gravel_bike", label: "Gravel Bikes" },
      { slug: "ebike_road", label: "Electric Road Bikes" },
    ],
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
    slug: "camping_vehicles",
    label: "Camper Vans & RVs",
    icon: "caravan",
    subcategories: [
      { slug: "camper_van", label: "Camper Vans" },
      { slug: "rv", label: "RVs & Motorhomes" },
      { slug: "travel_trailer", label: "Travel Trailers" },
      { slug: "rooftop_tent", label: "Rooftop Tents & Overland" },
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
      { slug: "snowmobile", label: "Snowmobiles" },
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
      { slug: "e_scooter", label: "Electric Scooters" },
      { slug: "e_bike_city", label: "City E-Bikes" },
      { slug: "onewheel", label: "Onewheels / EUC" },
    ],
  },
  {
    slug: "winter_other",
    label: "Other Winter",
    icon: "snowflake",
    subcategories: [
      { slug: "ice_skates", label: "Ice Skates" },
      { slug: "avalanche_safety", label: "Avalanche Safety Gear" },
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
    sub
  );
}
