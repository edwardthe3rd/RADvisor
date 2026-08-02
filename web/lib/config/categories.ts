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
    // equipment.attributes.gear_type. Demos & season leases are operator-level flags
    // (operators.offers_demo / offers_season_lease), not subcategories. Searchable
    // attribute vocabulary: instructions/extraction/snow_sports.md.
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
      { slug: "ice_skates", label: "Ice Skates" }, // moved here from the retired winter_other category
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
      { slug: "accessory", label: "Accessories" }, // cluster-wide — see road_cycling
      // Demos/leases are operator-level flags (offers_demo / offers_season_lease), not subcategories — see §3b.
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
      // Added 2026-08-01 from live rate cards during Pass B calibration (road_cycling.md §6).
      { slug: "surrey", label: "Surrey (Pedal Quadricycle)" }, // Tahoe Bike Co: 2-pedal & 4-pedal
      { slug: "trike", label: "Adult Trike" }, // Anderson's: "ADULT TRIKES — 3-Wheel Bike"
      // Accessories — shown as chips but don't drive browse-category membership.
      { slug: "bike_trailer", label: "Bike Trailer" },
      { slug: "bike_rack", label: "Bike Rack" },
      // `accessory` is cluster-wide (all four cycling categories) for small gear an operator
      // prices as a STANDALONE rental rather than a bundled add-on — e.g. Tahoe Bike Co's
      // "Child Seat $3/hr, $10/half, $12/day". Bundled extras stay in `addons`.
      { slug: "accessory", label: "Accessories" },
      // Demos/leases are operator-level flags (offers_demo / offers_season_lease), not subcategories — see §3b.
    ],
  },
  {
    slug: "burning_man_bikes",
    label: "Burning Man Bikes",
    icon: "bike",
    subcategories: [
      { slug: "playa_bike", label: "Playa Bikes" },
      { slug: "accessory", label: "Accessories" }, // cluster-wide — see road_cycling
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
      { slug: "foil", label: "Foilboards & Hydrofoils" }, // wake/surf/wind/SUP foiling boards + wings
      { slug: "efoil", label: "eFoils (Electric)" }, // motorized electric hydrofoil boards
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
    label: "Overland & Vehicle Camping",
    icon: "caravan",
    // Overland-focused only. NO conventional travel trailers, RVs, or motorhomes —
    // just overland-style rigs/vans, off-road expedition trailers, motorcycle
    // overlanding, and the accessory gear that outfits them.
    subcategories: [
      { slug: "overland_rig", label: "Overland Rigs (Built 4x4)" },
      { slug: "camper_van", label: "Camper Vans" },
      { slug: "rooftop_tent", label: "Rooftop Tents" },
      { slug: "overland_trailer", label: "Overland Trailers (Off-Road / Expedition)" },
      { slug: "moto_overland", label: "Motorcycle Overlanding" },
      { slug: "vehicle_accessories", label: "Vehicle Accessories (Awnings, Recovery, Fridges)" },
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
    label: "Motorcycles & Road Rentals",
    icon: "bike",
    // Street-legal, road-going rentals. RESOLVED 2026-08-01 (Pass B calibration): this category
    // also owns licence-free road vehicles, which previously had no home anywhere in the taxonomy
    // and were being dropped. The dividing line from off_road is street-legality, not engine or
    // wheel count; the line from electric_transport is the power source.
    subcategories: [
      { slug: "street_moto", label: "Street Motorcycles" },
      { slug: "adventure_moto", label: "Adventure / Dual-Sport" },
      // Rolling Freedom (Stateline NV) rents 3+ Polaris Slingshots and Honda Ruckus mopeds and
      // advertises that neither needs a specialised licence — which is exactly what separates
      // them from street_moto. Both are real, priced, take-away rentals.
      { slug: "autocycle", label: "Autocycles (Slingshot, Spyder)" }, // 3-wheel road vehicles
      { slug: "moped_scooter", label: "Mopeds & Scooters" }, // gas, sit-down, small-displacement
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
    slug: "mountaineering",
    label: "Mountaineering",
    icon: "mountain",
    // Non-ski alpine/glacier travel gear. Distinct from rock_climbing (crag/sport)
    // and snow_sports (ski touring). The winter_mountaineering activity maps here.
    subcategories: [
      { slug: "mountaineering_boots", label: "Mountaineering Boots" },
      { slug: "ice_axe", label: "Ice Axes" },
      { slug: "crampons", label: "Crampons" },
      { slug: "rope_hardware", label: "Ropes & Hardware" },
      { slug: "helmet", label: "Helmets" },
      { slug: "full_kit", label: "Complete Mountaineering Kits" },
    ],
  },
  {
    slug: "hunting",
    label: "Hunting",
    icon: "target",
    // Gear rentals only — NO firearms (rental/liability). Archery (bows) is fine.
    subcategories: [
      { slug: "optics", label: "Optics (Binoculars, Spotting Scopes, Rangefinders)" },
      { slug: "blind_treestand", label: "Blinds & Treestands" },
      { slug: "game_cart_pack", label: "Game Carts & Packs" },
      { slug: "archery", label: "Archery (Bows)" },
      { slug: "accessories", label: "Accessories" },
    ],
  },
  {
    slug: "fishing",
    label: "Fishing",
    icon: "fish",
    subcategories: [
      { slug: "fly_fishing", label: "Fly Fishing" },
      { slug: "spin_conventional", label: "Spin & Conventional" },
      { slug: "ice_fishing", label: "Ice Fishing" },
      { slug: "float_tube", label: "Float Tubes & Personal Watercraft" },
      { slug: "waders", label: "Waders" },
      { slug: "accessories", label: "Accessories" },
    ],
  },
  {
    slug: "disc_golf",
    label: "Disc Golf",
    icon: "disc",
    subcategories: [
      { slug: "disc_set", label: "Disc Sets" },
      { slug: "basket", label: "Portable Baskets" },
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
      { slug: "onewheel", label: "Onewheel" },
      { slug: "euc", label: "Electric Unicycle (EUC)" },
      { slug: "segway", label: "Segway" },
      { slug: "accessory", label: "Accessories" }, // cluster-wide — see road_cycling
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
